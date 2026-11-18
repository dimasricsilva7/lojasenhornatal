import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import UpsellClient from "@/app/upsell/[orderId]/UpsellClient";
import PurchaseTracker from "@/app/pedido/sucesso/[orderId]/PurchaseTracker";
import { claimPurchasePixel } from "@/lib/purchase-pixel";
import { CAMPAIGN, UPSELLS } from "@/lib/led/config";

export const dynamic = "force-dynamic";

/**
 * Ofertas pós-compra da campanha LED: /arvore-montada-led/oferta/<pedido>?o=<índice>.
 * Mostra os upsells da campanha em sequência (cada aceite gera um novo PIX via /api/upsell),
 * e no fim leva para a tela de sucesso. Isolado da loja principal pela campaign.
 */
export default async function LedOfertaPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { o?: string };
}) {
  const order = await db.order.findUnique({ where: { displayId: params.orderId } });
  const success = `/pedido/sucesso/${params.orderId}`;
  if (!order || order.isUpsellOrder || order.campaign !== CAMPAIGN) notFound();
  if (order.status !== "PAID") redirect(success);

  // Produtos de upsell da campanha (na ordem do config) ainda não comprados neste pedido.
  const slugs = UPSELLS.map((u) => u.slug);
  const products = await db.product.findMany({
    where: { campaign: CAMPAIGN, slug: { in: slugs }, type: "UPSELL", active: true, upsellEnabled: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const paid = await db.orderItem.findMany({
    where: { order: { parentOrderId: order.id, isUpsellOrder: true, status: "PAID" } },
    select: { productId: true },
  });
  const paidIds = new Set(paid.map((p) => p.productId));
  const offers = UPSELLS.map((cfg) => ({ cfg, prod: bySlug.get(cfg.slug) })).filter((o) => o.prod && !paidIds.has(o.prod.id));

  const index = Math.max(0, Number.parseInt(searchParams.o ?? "0", 10) || 0);
  const offer = offers[index];
  if (!offer || !offer.prod) redirect(success);
  const prod = offer.prod;

  const nextHref = index + 1 < offers.length ? `/arvore-montada-led/oferta/${order.displayId}?o=${index + 1}` : success;
  const shouldFirePixel = await claimPurchasePixel(order);

  return (
    <>
      {shouldFirePixel && (
        <PurchaseTracker eventId={order.metaEventId ?? `purchase_${order.id}`} valueCents={order.totalCents} orderId={order.displayId} />
      )}
      <UpsellClient
        key={prod.id}
        parentOrderId={order.displayId}
        nextHref={nextHref}
        eyebrow={index === 0 ? "Pagamento aprovado! Oferta exclusiva pra você" : "Mais uma oferta exclusiva"}
        step={{ current: index + 1, total: offers.length }}
        product={{
          id: prod.id,
          name: offer.cfg.name,
          image: offer.cfg.image,
          compareAtCents: prod.compareAtCents ?? offer.cfg.priceCents,
          priceCents: prod.upsellPriceCents ?? offer.cfg.priceCents,
          headline: offer.cfg.blurb ?? "Oferta especial só para quem acabou de comprar.",
        }}
      />
    </>
  );
}
