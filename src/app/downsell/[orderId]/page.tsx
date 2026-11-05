import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOfferSequence } from "@/lib/offers";

export const dynamic = "force-dynamic";

/** Link antigo/direto: leva ao primeiro downsell da sequência de ofertas. */
export default async function DownsellPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({ where: { displayId: params.orderId } });
  if (!order || order.isUpsellOrder) notFound();
  const { offers } = await getOfferSequence(order);
  const i = offers.findIndex((o) => o.type === "DOWNSELL");
  redirect(i >= 0 ? `/upsell/${order.displayId}?o=${i}` : `/pedido/sucesso/${order.displayId}`);
}
