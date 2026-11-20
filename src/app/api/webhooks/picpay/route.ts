import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStatus } from "@/lib/picpay";
import { markOrderPaidGeneric } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// O PicPay POSTa a mudança de status da cobrança. Não confiamos no payload:
// consultamos GET /charge/{merchantChargeId} com nosso token (fonte de verdade)
// antes de marcar pago. Um POST forjado não aprova nada.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { data?: { merchantChargeId?: string }; merchantChargeId?: string } | null;
  const chargeId = body?.data?.merchantChargeId ?? body?.merchantChargeId;
  if (!chargeId || typeof chargeId !== "string") return NextResponse.json({ ok: true, ignored: true });

  try {
    if ((await getStatus(chargeId)) === "PAID") {
      const order = await db.order.findFirst({ where: { gateway: "picpay", bravopayTransactionId: chargeId } });
      if (order) await markOrderPaidGeneric(order.id, { providerTxId: chargeId, amountCents: order.totalCents, method: "pix" });
    }
  } catch (err) {
    console.error("[webhook picpay] erro ao processar", err);
  }
  return NextResponse.json({ ok: true });
}
