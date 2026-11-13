import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { confirmInfinitePayOrder } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// O webhook da InfinitePay NÃO é assinado. Nunca confiamos no payload: a marcação
// como pago passa por confirmInfinitePayOrder → payment_check no servidor.
type InfinitePayWebhook = {
  invoice_slug?: string;
  order_nsu?: string;
  transaction_nsu?: string;
  capture_method?: string;
  amount?: number;
  paid_amount?: number;
};

export async function POST(req: NextRequest) {
  let payload: InfinitePayWebhook;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { order_nsu: orderNsu, transaction_nsu: transactionNsu, invoice_slug: slug } = payload;
  if (!orderNsu || !transactionNsu || !slug) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Dedup: cada transação é processada uma vez (sem id de evento, usamos o transaction_nsu).
  try {
    await db.webhookEvent.create({
      data: {
        provider: "infinitepay",
        eventId: `infinitepay:${transactionNsu}`,
        eventType: "payment",
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }

  try {
    const order = await db.order.findUnique({ where: { displayId: orderNsu }, include: { customer: true } });
    if (order && order.gateway === "infinitepay") {
      await confirmInfinitePayOrder(order, { transactionNsu, slug });
    }
    await db.webhookEvent.update({ where: { eventId: `infinitepay:${transactionNsu}` }, data: { processedAt: new Date() } });
  } catch (err) {
    console.error("[webhook infinitepay] erro ao processar", err);
    // 200 mesmo assim: o evento está persistido e pode ser reprocessado.
  }

  return NextResponse.json({ ok: true });
}
