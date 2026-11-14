import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStatus } from "@/lib/mercadopago";
import { markOrderPaidGeneric } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// O webhook do Mercado Pago é só um gatilho: consultamos GET /v1/payments/{id}
// com o nosso access token (fonte de verdade) antes de marcar pago. Um POST
// forjado não consegue aprovar nada, porque o status vem do servidor do MP.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const url = new URL(req.url);
  const type = body?.type ?? url.searchParams.get("type") ?? undefined;
  const paymentId = body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type && type !== "payment") return NextResponse.json({ ok: true, ignored: true });
  if (!paymentId) return NextResponse.json({ ok: true, ignored: true });

  try {
    if ((await getStatus(String(paymentId))) === "PAID") {
      const order = await db.order.findFirst({ where: { gateway: "mercadopago", bravopayTransactionId: String(paymentId) } });
      if (order) await markOrderPaidGeneric(order.id, { providerTxId: String(paymentId), amountCents: order.totalCents, method: "pix" });
    }
  } catch (err) {
    console.error("[webhook mercadopago] erro ao processar", err);
  }
  return NextResponse.json({ ok: true });
}
