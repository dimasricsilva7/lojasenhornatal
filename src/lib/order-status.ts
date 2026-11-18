import { db } from "@/lib/db";
import { Prisma, type Order, type Customer } from "@prisma/client";
import { findTransactionByExternalReference, getTransaction, type BravopayTransaction } from "@/lib/bravopay";
import { checkPayment } from "@/lib/infinitepay";
import { getStatus as mpGetStatus } from "@/lib/mercadopago";
import { getStatus as pbGetStatus } from "@/lib/pagbank";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { sendOrderToTranslog, translogEnabled } from "@/lib/translog";

const STATUS_MAP: Record<BravopayTransaction["status"], Order["status"]> = {
  PENDING: "PENDING",
  PAID: "PAID",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
  CHARGEBACK: "CHARGEBACK",
  FAILED: "FAILED",
};

type OrderWithCustomer = Order & { customer: Customer };

/**
 * Efeitos colaterais de um pedido que acabou de ser pago, comuns a todos os
 * gateways: registra o pagamento, recupera o carrinho, grava o evento e envia o
 * Purchase pela Conversions API do Meta. O pedido JÁ deve ter sido marcado PAID
 * pelo chamador de forma atômica; `firstTransition` diz se esta é a primeira vez
 * (só então o Purchase é enviado, uma única vez por pedido principal).
 */
export async function recordOrderPaid(
  order: OrderWithCustomer,
  firstTransition: boolean,
  payment: {
    transactionId: string;
    statusLabel: string;
    amountCents: number;
    netCents?: number | null;
    feeCents?: number | null;
    method: string;
    rawPayload: Prisma.InputJsonValue;
  }
) {
  await db.payment.upsert({
    where: { bravopayTransactionId: payment.transactionId },
    update: { status: payment.statusLabel, amountCents: payment.amountCents, netCents: payment.netCents ?? null, feeCents: payment.feeCents ?? null },
    create: {
      orderId: order.id,
      bravopayTransactionId: payment.transactionId,
      status: payment.statusLabel,
      amountCents: payment.amountCents,
      netCents: payment.netCents ?? null,
      feeCents: payment.feeCents ?? null,
      method: payment.method,
      rawPayload: payment.rawPayload,
    },
  });

  await db.abandonedCart.updateMany({
    where: { orderId: order.id },
    data: { status: "RECOVERED", recoveredAt: new Date() },
  });

  await db.trackingEvent.create({
    data: { orderId: order.id, eventName: "purchase", metadata: { transactionId: payment.transactionId } },
  });

  // Upsell/downsell é complemento do pedido principal: não é uma nova compra
  // para o Meta. Só o pedido principal envia Purchase (uma única vez).
  if (firstTransition && !order.isUpsellOrder) {
    // Compras confirmadas fora da visita original (webhook atrasado, reverify
    // manual, polling que só rodou depois) não têm cookies de navegador aqui.
    // Reconstruímos o fbc a partir do fbclid salvo no pedido para que a compra
    // ainda seja atribuída à campanha/anúncio corretos no Meta Ads.
    const fbc = order.fbclid ? `fb.1.${order.createdAt.getTime()}.${order.fbclid}` : undefined;

    await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: order.metaEventId ?? `purchase_${order.id}`,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/pedido/sucesso/${order.displayId}`,
      userData: {
        email: order.customer.email,
        phone: order.customer.phone,
        firstName: order.customer.name.split(" ")[0],
        fbc,
      },
      customData: {
        value: order.totalCents / 100,
        currency: "BRL",
        content_ids: [order.id],
        order_id: order.displayId,
      },
    }).catch(() => {});

    // Transportadora Translog: envia o pedido pago e grava o código de rastreio.
    // No-op se TRANSLOG_INGEST_URL/TRANSLOG_SECRET não estiverem configurados.
    if (translogEnabled()) {
      const mainItem = await db.orderItem.findFirst({ where: { orderId: order.id, kind: "main" }, select: { name: true } });
      await sendOrderToTranslog(order, mainItem?.name ?? "Árvore de Natal");
    }
  }
}

/**
 * Applies a BravoPay transaction snapshot onto our local order. This is the
 * single choke point that can mark a BravoPay order PAID — called from the webhook
 * handler (push) and from the polling / manual reverify paths (pull). Never
 * call `db.order.update({ status: "PAID" })` anywhere else in the codebase.
 */
export async function applyTransactionSnapshot(orderId: string, tx: BravopayTransaction) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return null;

  const nextStatus = STATUS_MAP[tx.status] ?? order.status;
  const wasAlreadyPaid = order.status === "PAID";
  // O PIX do BravoPay é gerado em ~5-30s depois da criação. Quando o copy_paste
  // ficar disponível numa sincronização, é aqui que ele é persistido.
  const pixCode = tx.pix?.copy_paste;
  const fillPix =
    pixCode && !order.pixCopyPaste
      ? { pixCopyPaste: pixCode, pixExpiresAt: tx.pix?.expires_at ? new Date(tx.pix.expires_at) : order.pixExpiresAt }
      : {};

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: nextStatus,
      bravopayTransactionId: tx.id,
      lastCheckedAt: new Date(),
      ...fillPix,
      paidAt: nextStatus === "PAID" && !order.paidAt ? new Date() : order.paidAt,
    },
  });

  if (nextStatus === "PAID") {
    await recordOrderPaid(order, !wasAlreadyPaid, {
      transactionId: tx.id,
      statusLabel: tx.status,
      amountCents: tx.amount_cents,
      netCents: tx.net_cents,
      feeCents: tx.fee_cents,
      method: tx.method,
      rawPayload: tx as unknown as Prisma.InputJsonValue,
    });
  } else if (nextStatus === "FAILED" || nextStatus === "EXPIRED") {
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "purchase_failed", metadata: { status: nextStatus } },
    });
  }

  return updated;
}

/**
 * Marca um pedido como pago, válido para qualquer gateway de confirmação própria
 * (Mercado Pago, PagBank, InfinitePay). A transição para PAID é ATÔMICA
 * (updateMany com status != PAID), então webhook e polling chegando ao mesmo
 * tempo não disparam o Purchase do Meta duas vezes. O chamador já confirmou o
 * pagamento na fonte de verdade do gateway antes de chamar aqui.
 */
export async function markOrderPaidGeneric(
  orderId: string,
  info: { providerTxId: string; amountCents: number; netCents?: number | null; method: string }
) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return null;
  if (order.status === "PAID") return order;

  const claim = await db.order.updateMany({
    where: { id: order.id, status: { not: "PAID" } },
    data: {
      status: "PAID",
      paidAt: new Date(),
      bravopayTransactionId: info.providerTxId, // coluna genérica de "id da transação do gateway"
      lastCheckedAt: new Date(),
    },
  });
  if (claim.count !== 1) return db.order.findUnique({ where: { id: orderId }, include: { customer: true } });

  await recordOrderPaid(order, true, {
    transactionId: info.providerTxId,
    statusLabel: "PAID",
    amountCents: info.amountCents,
    netCents: info.netCents ?? null,
    feeCents: null,
    method: info.method,
    rawPayload: info as unknown as Prisma.InputJsonValue,
  });

  return db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
}

/** Confirma via payment_check e marca como pago (InfinitePay). */
export async function confirmInfinitePayOrder(order: OrderWithCustomer, info: { transactionNsu: string; slug: string }) {
  if (order.status === "PAID") return order;
  const check = await checkPayment({ orderNsu: order.displayId, transactionNsu: info.transactionNsu, slug: info.slug });
  if (!check.paid) return order;
  return markOrderPaidGeneric(order.id, {
    providerTxId: info.transactionNsu,
    amountCents: check.amount ?? order.totalCents,
    netCents: check.paid_amount ?? null,
    method: check.capture_method ?? "credit_card",
  });
}

/**
 * Pull-based sync used by frontend polling and the admin "reverify" button.
 * Throttled by `minIntervalMs` so a chatty client can't burn BravoPay's rate
 * limit (60 req/min per key, shared across the whole store).
 */
export async function syncOrderFromBravopay(order: Order, minIntervalMs = 4000) {
  if (order.gateway === "infinitepay") return order; // pedido de outro gateway: não consultar a BravoPay
  const terminal: Order["status"][] = ["PAID", "REFUNDED", "CHARGEBACK"];
  if (terminal.includes(order.status)) return order;

  if (order.lastCheckedAt && Date.now() - order.lastCheckedAt.getTime() < minIntervalMs) {
    return order;
  }

  // Preferimos GET /transactions/{id}: é por aí que o BravoPay disponibiliza o
  // pix.copy_paste gerado de forma assíncrona. Caímos na busca por referência
  // só se ainda não temos o id da transação.
  const tx = order.bravopayTransactionId
    ? await getTransaction(order.bravopayTransactionId)
    : await findTransactionByExternalReference(order.displayId);
  if (!tx) {
    await db.order.update({ where: { id: order.id }, data: { lastCheckedAt: new Date() } });
    return order;
  }

  return applyTransactionSnapshot(order.id, tx);
}

/**
 * Sincroniza o status consultando a fonte de verdade do gateway do pedido.
 * Usado pelo polling do checkout e pelo reverify do admin. Mercado Pago e PagBank
 * confirmam por consulta autoritativa (GET) com o nosso token — por isso o webhook
 * é só um gatilho e nada é marcado pago sem este GET.
 */
export async function syncOrderFromProvider(order: Order, minIntervalMs = 4000) {
  if (order.gateway === "bravopay") return syncOrderFromBravopay(order, minIntervalMs);
  if (order.gateway === "infinitepay") return order; // confirmado no retorno/webhook

  const terminal: Order["status"][] = ["PAID", "REFUNDED", "CHARGEBACK"];
  if (terminal.includes(order.status)) return order;
  if (order.lastCheckedAt && Date.now() - order.lastCheckedAt.getTime() < minIntervalMs) return order;
  if (!order.bravopayTransactionId) {
    await db.order.update({ where: { id: order.id }, data: { lastCheckedAt: new Date() } });
    return order;
  }

  let status: "PAID" | "PENDING" | "FAILED" = "PENDING";
  if (order.gateway === "mercadopago") status = await mpGetStatus(order.bravopayTransactionId);
  else if (order.gateway === "pagbank") status = await pbGetStatus(order.bravopayTransactionId);

  if (status === "PAID") {
    return (await markOrderPaidGeneric(order.id, { providerTxId: order.bravopayTransactionId, amountCents: order.totalCents, method: "pix" })) ?? order;
  }
  await db.order.update({ where: { id: order.id }, data: { lastCheckedAt: new Date() } });
  return order;
}
