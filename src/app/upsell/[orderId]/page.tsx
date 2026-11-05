import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import UpsellClient from "./UpsellClient";
import PurchaseTracker from "@/app/pedido/sucesso/[orderId]/PurchaseTracker";
import { claimPurchasePixel } from "@/lib/purchase-pixel";
import { getOfferSequence } from "@/lib/offers";
import { fillSizeTokens } from "@/lib/sizes";

export const dynamic = "force-dynamic";

/**
 * Ofertas pós-compra em sequência: /upsell/<pedido>?o=<índice>.
 * Mostra todos os upsells e depois todos os downsells; nenhum conta como nova compra no Meta.
 */
export default async function UpsellPage({ params, searchParams }: { params: { orderId: string }; searchParams: { o?: string } }) {
  const order = await db.order.findUnique({ where: { displayId: params.orderId } });
  if (!order || order.isUpsellOrder) notFound();
  const success = `/pedido/sucesso/${order.displayId}`;
  if (order.status !== "PAID") redirect(success);

  const { offers, ctx } = await getOfferSequence(order);
  const fill = (t: string) => fillSizeTokens(t, { maior: ctx.maior, atual: ctx.atual });
  const index = Math.max(0, Number.parseInt(searchParams.o ?? "0", 10) || 0);
  const offer = offers[index];
  if (!offer) redirect(success);

  const nextHref = index + 1 < offers.length ? `/upsell/${order.displayId}?o=${index + 1}` : success;
  const shouldFirePixel = await claimPurchasePixel(order);
  const isDownsell = offer.type === "DOWNSELL";

  return (
    <>
      {shouldFirePixel && (
        <PurchaseTracker eventId={order.metaEventId ?? `purchase_${order.id}`} valueCents={order.totalCents} orderId={order.displayId} />
      )}
      <UpsellClient
        key={offer.id}
        parentOrderId={order.displayId}
        nextHref={nextHref}
        eyebrow={isDownsell ? "Espere! Uma opção mais em conta" : index === 0 ? "Pagamento aprovado! Oferta exclusiva antes de finalizar" : "Mais uma oferta exclusiva"}
        step={{ current: index + 1, total: offers.length }}
        product={{
          id: offer.id,
          name: fill(offer.name),
          image: offer.images[0] ?? "/images/placeholder.svg",
          compareAtCents: offer.compareAtCents ?? offer.priceCents,
          priceCents: offer.upsellPriceCents ?? offer.priceCents,
          headline: fill(offer.upsellHeadline ?? "Oferta especial só para quem acabou de comprar."),
        }}
      />
    </>
  );
}
