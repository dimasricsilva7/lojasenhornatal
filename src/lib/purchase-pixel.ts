import { db } from "@/lib/db";

/**
 * O Purchase do navegador dispara UMA vez por pedido principal, na primeira página
 * pós-pagamento que o cliente abrir (oferta de upsell ou obrigado). O "claim" é
 * atômico: só a primeira requisição consegue marcar pixelPurchaseFiredAt.
 * Pedidos de upsell/downsell nunca disparam Purchase.
 */
export async function claimPurchasePixel(order: {
  id: string;
  status: string;
  isUpsellOrder: boolean;
  pixelPurchaseFiredAt: Date | null;
}): Promise<boolean> {
  if (order.status !== "PAID" || order.isUpsellOrder || order.pixelPurchaseFiredAt) return false;
  const claim = await db.order.updateMany({
    where: { id: order.id, pixelPurchaseFiredAt: null },
    data: { pixelPurchaseFiredAt: new Date() },
  });
  return claim.count === 1;
}
