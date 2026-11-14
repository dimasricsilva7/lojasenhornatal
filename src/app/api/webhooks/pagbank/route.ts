import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStatus } from "@/lib/pagbank";
import { markOrderPaidGeneric } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// O PagBank POSTa o pedido inteiro. Não confiamos no payload: consultamos
// GET /orders/{id} com o nosso token (fonte de verdade) antes de marcar pago.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const orderId = body?.id;
  if (!orderId || typeof orderId !== "string") return NextResponse.json({ ok: true, ignored: true });

  try {
    if ((await getStatus(orderId)) === "PAID") {
      const order = await db.order.findFirst({ where: { gateway: "pagbank", bravopayTransactionId: orderId } });
      if (order) await markOrderPaidGeneric(order.id, { providerTxId: orderId, amountCents: order.totalCents, method: "pix" });
    }
  } catch (err) {
    console.error("[webhook pagbank] erro ao processar", err);
  }
  return NextResponse.json({ ok: true });
}
