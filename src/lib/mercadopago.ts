const BASE_URL = process.env.MERCADOPAGO_BASE_URL ?? "https://api.mercadopago.com";

function accessToken(): string {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
  return t;
}

export class MercadoPagoError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Mapeia o status do Mercado Pago para o nosso. approved = pago. */
export function mpStatusToLocal(status: string | undefined): "PAID" | "PENDING" | "FAILED" {
  if (status === "approved") return "PAID";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(status ?? "")) return "FAILED";
  return "PENDING";
}

/**
 * Cria um pagamento PIX e devolve o copia-e-cola para exibir NO nosso checkout.
 * transaction_amount é em REAIS (decimal). Omitimos date_of_expiration (default
 * 24h do MP) para não arriscar formato de data; o countdown usa expiresAt local.
 */
export async function createPixCharge(input: {
  amountCents: number;
  description: string;
  orderNsu: string;
  payer: { email: string; firstName: string; cpf: string };
}): Promise<{ providerTxId: string; copyPaste: string; expiresAt: Date }> {
  const body = {
    transaction_amount: input.amountCents / 100,
    payment_method_id: "pix",
    description: input.description.slice(0, 256),
    external_reference: input.orderNsu,
    payer: {
      email: input.payer.email,
      first_name: input.payer.firstName,
      identification: { type: "CPF", number: input.payer.cpf.replace(/\D/g, "") },
    },
  };

  const res = await fetch(`${BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
      "X-Idempotency-Key": input.orderNsu,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: number | string;
    message?: string;
    point_of_interaction?: { transaction_data?: { qr_code?: string } };
  };
  const copyPaste = json?.point_of_interaction?.transaction_data?.qr_code;
  if (!res.ok || !json.id || !copyPaste) {
    throw new MercadoPagoError(json?.message ?? `Mercado Pago /payments falhou (${res.status})`, res.status);
  }
  return { providerTxId: String(json.id), copyPaste, expiresAt: new Date(Date.now() + 24 * 3600 * 1000) };
}

/** Consulta autoritativa do status (fonte de verdade; o webhook é só gatilho). */
export async function getStatus(paymentId: string): Promise<"PAID" | "PENDING" | "FAILED"> {
  const res = await fetch(`${BASE_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string };
  return mpStatusToLocal(json.status);
}
