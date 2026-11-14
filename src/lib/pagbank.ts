const BASE_URL = process.env.PAGBANK_BASE_URL ?? "https://api.pagseguro.com";

function token(): string {
  const t = process.env.PAGBANK_TOKEN;
  if (!t) throw new Error("PAGBANK_TOKEN não configurado");
  return t;
}

export class PagBankError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Mapeia o status da cobrança PagBank para o nosso. PAID = pago. */
export function pbStatusToLocal(status: string | undefined): "PAID" | "PENDING" | "FAILED" {
  if (status === "PAID") return "PAID";
  if (["DECLINED", "CANCELED", "CANCELLED"].includes(status ?? "")) return "FAILED";
  return "PENDING";
}

/**
 * Cria um pedido com cobrança PIX e devolve o copia-e-cola para o nosso checkout.
 * Valores em CENTAVOS (igual ao nosso totalCents). O PagBank devolve o código em
 * charges[0].qr_code.text; o QR é renderizado no cliente a partir desse texto.
 */
export async function createPixCharge(input: {
  amountCents: number;
  description: string;
  orderNsu: string;
  customer: { name: string; email: string; cpf: string; phone: string };
  webhookUrl: string;
  expiresInSeconds?: number;
}): Promise<{ providerTxId: string; copyPaste: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + (input.expiresInSeconds ?? 3600) * 1000);
  const phone = input.customer.phone.replace(/\D/g, "");
  const name = input.description.slice(0, 100);
  const body = {
    reference_id: input.orderNsu,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      tax_id: input.customer.cpf.replace(/\D/g, ""),
      phones: [{ country: "55", area: phone.slice(0, 2), number: phone.slice(2), type: "MOBILE" }],
    },
    items: [{ reference_id: input.orderNsu, name, quantity: 1, unit_amount: input.amountCents }],
    charges: [
      {
        reference_id: input.orderNsu,
        description: name,
        amount: { value: input.amountCents, currency: "BRL" },
        payment_method: { type: "PIX", pix: { expiration_date: expiresAt.toISOString() } },
      },
    ],
    notification_urls: [input.webhookUrl],
  };

  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error_messages?: { description?: string }[];
    charges?: { qr_code?: { text?: string } }[];
    qr_codes?: { text?: string }[];
  };
  const copyPaste = json?.charges?.[0]?.qr_code?.text ?? json?.qr_codes?.[0]?.text;
  if (!res.ok || !json.id || !copyPaste) {
    const msg = json?.error_messages?.[0]?.description ?? `PagBank /orders falhou (${res.status})`;
    throw new PagBankError(msg, res.status);
  }
  return { providerTxId: json.id, copyPaste, expiresAt };
}

/** Consulta autoritativa do pedido (fonte de verdade; o webhook é só gatilho). */
export async function getStatus(orderId: string): Promise<"PAID" | "PENDING" | "FAILED"> {
  const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { charges?: { status?: string }[] };
  // Pago se QUALQUER cobrança do pedido estiver PAID.
  const statuses = (json.charges ?? []).map((c) => c.status);
  if (statuses.includes("PAID")) return "PAID";
  if (statuses.length > 0 && statuses.every((s) => ["DECLINED", "CANCELED", "CANCELLED"].includes(s ?? ""))) return "FAILED";
  return "PENDING";
}
