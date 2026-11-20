import { db } from "@/lib/db";
import type { Order, Customer } from "@prisma/client";
import { createPixTransaction, getTransaction, BravopayError } from "@/lib/bravopay";
import { createCheckoutLink, InfinitePayError } from "@/lib/infinitepay";
import { createPixCharge as mpCreatePix, MercadoPagoError } from "@/lib/mercadopago";
import { createPixCharge as pbCreatePix, PagBankError } from "@/lib/pagbank";
import { createPixCharge as ppCreatePix, PicPayError } from "@/lib/picpay";
import { buildPixCode } from "@/lib/pix-brcode";
import type { SettingsMap } from "@/lib/settings";

// Meio de cobrança COMPARTILHADO por todos os checkouts (loja principal, LED, etc.).
// O admin escolhe UM gateway em Configurações (payment_gateway) e ele vale para
// todos os produtos — "o que decidir em um serve no outro".
const VALID = ["infinitepay", "mercadopago", "pagbank", "picpay", "pixmanual"];
export function resolveGateway(raw: string | undefined): string {
  return raw && VALID.includes(raw) ? raw : "bravopay";
}

/** Erro já tratado (mensagem segura p/ o cliente). Erro inesperado sobe como Error comum. */
export class GatewayError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

type OrderWithCustomer = Order & { customer: Customer };
type Utm = {
  source?: string; medium?: string; campaign?: string; content?: string; term?: string;
  fbclid?: string; gclid?: string; ttclid?: string;
};

/**
 * Gera a cobrança do pedido no gateway escolhido e devolve o pedido atualizado.
 * - PIX na própria página (bravopay/mercadopago/pagbank/picpay): grava pixCopyPaste.
 * - pixmanual: gera o copia-e-cola da chave do lojista (baixa manual no admin).
 * - infinitepay: gera link hospedado e grava checkoutUrl (o cliente é redirecionado).
 * Lança GatewayError (mensagem segura) em falha conhecida do provedor.
 */
export async function generateOrderPayment(
  order: OrderWithCustomer,
  gateway: string,
  opts: { settings: SettingsMap; siteUrl: string; description: string; productId?: string; utm?: Utm; metadata?: Record<string, string> }
): Promise<Order> {
  const { settings, siteUrl, description } = opts;
  const c = order.customer;

  try {
    if (gateway === "infinitepay") {
      const url = await createCheckoutLink({
        amountCents: order.totalCents,
        description: `${description} · Pedido ${order.displayId}`,
        orderNsu: order.displayId,
        redirectUrl: `${siteUrl}/pedido/sucesso/${order.displayId}`,
        webhookUrl: `${siteUrl}/api/webhooks/infinitepay`,
        customer: { name: c.name, email: c.email, phone: c.phone },
      });
      return db.order.update({ where: { id: order.id }, data: { status: "PENDING", gateway: "infinitepay", checkoutUrl: url } });
    }

    if (gateway === "pixmanual") {
      if (!settings.pix_manual_key.trim()) throw new GatewayError("Chave PIX manual não configurada no admin.");
      const copyPaste = buildPixCode({
        key: settings.pix_manual_key,
        merchantName: settings.pix_manual_name || settings.store_name,
        merchantCity: settings.pix_manual_city || "SAO PAULO",
        amountCents: order.totalCents,
        txid: order.displayId,
      });
      return db.order.update({ where: { id: order.id }, data: { status: "PIX_GENERATED", gateway: "pixmanual", pixCopyPaste: copyPaste, pixExpiresAt: null } });
    }

    if (gateway === "mercadopago" || gateway === "pagbank" || gateway === "picpay") {
      const pix =
        gateway === "mercadopago"
          ? await mpCreatePix({ amountCents: order.totalCents, description, orderNsu: order.displayId, payer: { email: c.email, firstName: c.name.split(" ")[0], cpf: c.cpf } })
          : gateway === "pagbank"
          ? await pbCreatePix({ amountCents: order.totalCents, description, orderNsu: order.displayId, customer: { name: c.name, email: c.email, cpf: c.cpf, phone: c.phone }, webhookUrl: `${siteUrl}/api/webhooks/pagbank` })
          : await ppCreatePix({ amountCents: order.totalCents, orderNsu: order.displayId, customer: { name: c.name, email: c.email, cpf: c.cpf } });
      return db.order.update({
        where: { id: order.id },
        data: { status: "PIX_GENERATED", gateway, bravopayTransactionId: pix.providerTxId, pixCopyPaste: pix.copyPaste, pixExpiresAt: pix.expiresAt },
      });
    }

    // bravopay (padrão)
    const tx = await createPixTransaction({
      amountCents: order.totalCents,
      idempotencyKey: order.idempotencyKey,
      externalReference: order.displayId,
      description: `${description} · Pedido ${order.displayId}`,
      productId: opts.productId,
      customer: { name: c.name, email: c.email, cpf: c.cpf, phone: c.phone },
      metadata: opts.metadata,
      utm: opts.utm,
    });
    // BravoPay gera o copy_paste em ~5-30s; tenta uma leitura imediata, senão o polling do cliente pega.
    let pix = tx.pix?.copy_paste ?? null;
    let pixExp = tx.pix?.expires_at ? new Date(tx.pix.expires_at) : null;
    if (!pix && tx.id) {
      const again = await getTransaction(tx.id).catch(() => null);
      if (again?.pix?.copy_paste) {
        pix = again.pix.copy_paste;
        pixExp = again.pix.expires_at ? new Date(again.pix.expires_at) : null;
      }
    }
    return db.order.update({
      where: { id: order.id },
      data: { status: "PIX_GENERATED", gateway: "bravopay", bravopayTransactionId: tx.id, pixCopyPaste: pix, pixExpiresAt: pixExp },
    });
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    if (
      err instanceof BravopayError || err instanceof InfinitePayError ||
      err instanceof MercadoPagoError || err instanceof PagBankError || err instanceof PicPayError
    ) {
      throw new GatewayError(err.message, (err as { status?: number }).status ?? 502);
    }
    throw err; // inesperado: sobe como erro comum
  }
}
