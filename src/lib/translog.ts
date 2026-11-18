import "server-only";
import { db } from "@/lib/db";
import type { Order, Customer } from "@prisma/client";

// Integração com a transportadora Translog.
// Dispara só se TRANSLOG_INGEST_URL + TRANSLOG_SECRET estiverem configurados
// (sem isso, no-op — não quebra nada e não envia nada).
//
// Contrato (POST): header x-translog-secret + corpo
//   { externalId, recipientName, productName, phone, cpf, email, paymentStatus }
// Resposta: { orderId, trackingCode, result }  (result: processed | pending_credits | received)

type OrderWithCustomer = Order & { customer: Customer };

const INGEST_URL = process.env.TRANSLOG_INGEST_URL;
const SECRET = process.env.TRANSLOG_SECRET;

export function translogEnabled(): boolean {
  return Boolean(INGEST_URL && SECRET);
}

/**
 * Envia um pedido pago para a Translog e grava o código de rastreio no pedido.
 * Idempotente do lado da Translog (externalId = displayId). Nunca lança: em erro,
 * grava trackingStatus="error" e segue (o pagamento já foi confirmado).
 */
export async function sendOrderToTranslog(order: OrderWithCustomer, productName: string): Promise<void> {
  if (!translogEnabled()) return;
  try {
    const res = await fetch(INGEST_URL as string, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-translog-secret": SECRET as string },
      body: JSON.stringify({
        externalId: order.displayId,
        recipientName: order.customer.name,
        productName,
        phone: order.customer.phone,
        cpf: order.customer.cpf,
        email: order.customer.email,
        paymentStatus: "paid",
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { trackingCode?: string | null; result?: string };
    const code = data?.trackingCode ?? null;
    const status = res.ok ? (data?.result ?? "received") : "error";
    await db.order.update({
      where: { id: order.id },
      data: { trackingCode: code, trackingStatus: status },
    });
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "translog_dispatch", metadata: { status, trackingCode: code } },
    });
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { trackingStatus: "error" } }).catch(() => {});
    console.error("[translog] falha ao enviar pedido", order.displayId, err);
  }
}

export const TRANSLOG_TRACK_URL = process.env.TRANSLOG_TRACK_URL ?? "https://translog.vercel.app/rastrear";
