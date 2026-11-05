import { db } from "@/lib/db";
import { getSizes, sizeLabel } from "@/lib/sizes";

export const UPGRADE_SLUG = "upgrade-arvore-maior";

/** Tamanho comprado no pedido e o maior tamanho à venda. */
export async function sizeContext(orderId: string) {
  const [item, sizes] = await Promise.all([
    db.orderItem.findFirst({ where: { orderId, kind: "main" }, include: { product: true } }),
    getSizes(),
  ]);
  const largest = sizes[sizes.length - 1] ?? null;
  return {
    bought: item?.product ?? null,
    largest,
    atual: item?.product ? sizeLabel(item.product) : null,
    maior: largest ? sizeLabel(largest) : null,
  };
}

/**
 * Sequência de ofertas pós-compra de um pedido: TODOS os upsells ativos (na ordem do admin)
 * e depois TODOS os downsells ativos. Cada um é mostrado uma vez; aceitar ou recusar leva ao próximo.
 * Ofertas que o cliente já pagou neste pedido saem da sequência.
 * O upgrade só aparece para quem NÃO comprou o maior tamanho.
 */
export async function getOfferSequence(order: { id: string }) {
  const [offers, paid, ctx] = await Promise.all([
    db.product.findMany({
      where: { type: { in: ["UPSELL", "DOWNSELL"] }, active: true, upsellEnabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.orderItem.findMany({
      where: { order: { parentOrderId: order.id, isUpsellOrder: true, status: "PAID" } },
      select: { productId: true },
    }),
    sizeContext(order.id),
  ]);
  const paidIds = new Set(paid.map((p) => p.productId));
  const boughtLargest = !ctx.largest || !ctx.bought || ctx.bought.id === ctx.largest.id;
  const list = [...offers.filter((o) => o.type === "UPSELL"), ...offers.filter((o) => o.type === "DOWNSELL")].filter((o) => {
    if (paidIds.has(o.id)) return false;
    if (o.slug === UPGRADE_SLUG && boughtLargest) return false;
    return true;
  });
  return { offers: list, ctx };
}
