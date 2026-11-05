import { Suspense } from "react";
import { db } from "@/lib/db";
import { sizeLabel, sizeName } from "@/lib/sizes";
import { getSettings } from "@/lib/settings";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: { tamanho?: string } }) {
  const [mains, bumps, settings] = await Promise.all([
    db.product.findMany({ where: { type: "MAIN", active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.product.findMany({ where: { orderBumpEnabled: true, active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    getSettings(),
  ]);
  const mainProduct =
    mains.find((p) => p.slug === searchParams.tamanho) ?? mains.find((p) => p.featured) ?? mains[0];

  if (!mainProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>Produto indisponível no momento.</p>
      </main>
    );
  }

  return (
    <Suspense fallback={null}>
      <CheckoutClient
        shippingDays={settings.shipping_days || "3 a 5"}
        sizes={mains.map((m) => ({ slug: m.slug, label: sizeLabel(m), priceCents: m.priceCents }))}
        product={{
          slug: mainProduct.slug,
          name: sizeName(sizeLabel(mainProduct)),
          priceCents: mainProduct.priceCents,
          compareAtCents: mainProduct.compareAtCents ?? undefined,
          image: mainProduct.images[0] ?? "/images/placeholder.svg",
          label: sizeLabel(mainProduct),
        }}
        orderBumps={bumps.map((b) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          priceCents: b.orderBumpPriceCents ?? b.priceCents,
          compareAtCents: b.priceCents !== (b.orderBumpPriceCents ?? b.priceCents) ? b.priceCents : undefined,
          image: b.images[0] ?? null,
          featured: b.featured,
          headline: b.orderBumpHeadline ?? `Adicionar ${b.name}`,
        }))}
      />
    </Suspense>
  );
}
