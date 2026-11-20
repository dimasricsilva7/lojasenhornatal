// PicPay Empresas — cobrança PIX gerada via API e exibida NO nosso checkout
// (copia-e-cola + QR no cliente + polling), igual a Mercado Pago/PagBank.
// Auth: OAuth2 client_credentials (token vale ~5 min; pegamos um por operação).
// Doc: developers-business.picpay.com (prod ecommerce-api.svcp.picpay.com,
// sandbox ecommerce-api.svcp.ppay.me).
const BASE_URL = process.env.PICPAY_BASE_URL ?? "https://ecommerce-api.svcp.picpay.com";

export class PicPayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function creds() {
  const id = process.env.PICPAY_CLIENT_ID;
  const secret = process.env.PICPAY_CLIENT_SECRET;
  if (!id || !secret) throw new PicPayError("PICPAY_CLIENT_ID/PICPAY_CLIENT_SECRET não configurados", 0);
  return { id, secret };
}

async function accessToken(): Promise<string> {
  const { id, secret } = creds();
  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; token?: string };
  const t = json.access_token ?? json.token;
  if (!res.ok || !t) throw new PicPayError(`PicPay autenticação falhou (${res.status})`, res.status);
  return t;
}

// merchantChargeId aceita só [a-zA-Z0-9-] (6-36 chars); o nosso displayId tem "_".
const chargeId = (displayId: string) => displayId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 36);

/** Mapeia o chargeStatus do PicPay para o nosso. PAID = pago. */
export function ppStatusToLocal(status: string | undefined): "PAID" | "PENDING" | "FAILED" {
  if (status === "PAID") return "PAID";
  if (["CANCELED", "DENIED", "ERROR", "REFUNDED", "CHARGEBACK"].includes(status ?? "")) return "FAILED";
  return "PENDING"; // PRE_AUTHORIZED, PARTIAL, etc.
}

/**
 * Cria a cobrança PIX e devolve o copia-e-cola (transactions[0].pix.qrCode).
 * Valor em CENTAVOS (= totalCents). providerTxId = merchantChargeId: é por ele
 * que consultamos o status (GET /charge/{merchantChargeId}) e que o webhook chega.
 */
export async function createPixCharge(input: {
  amountCents: number;
  orderNsu: string;
  customer: { name: string; email: string; cpf: string };
  expiresInSeconds?: number;
}): Promise<{ providerTxId: string; copyPaste: string; expiresAt: Date }> {
  const token = await accessToken();
  const merchantChargeId = chargeId(input.orderNsu);
  const expiration = input.expiresInSeconds ?? 3600;
  // shortcut: sem deviceInformation (antifraude) — PIX direto costuma dispensar; se o
  // PicPay recusar pedindo device info, adicionar ip/sessionId do request aqui.
  const body = {
    paymentSource: "GATEWAY",
    merchantChargeId,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      documentType: "CPF",
      document: input.customer.cpf.replace(/\D/g, ""),
    },
    transactions: [{ amount: input.amountCents, pix: { expiration } }],
  };

  const res = await fetch(`${BASE_URL}/charge/pix`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    transactions?: { pix?: { qrCode?: string } }[];
  };
  const copyPaste = json?.transactions?.[0]?.pix?.qrCode;
  if (!res.ok || !copyPaste) {
    throw new PicPayError(json?.message ?? `PicPay /charge/pix falhou (${res.status})`, res.status);
  }
  return { providerTxId: merchantChargeId, copyPaste, expiresAt: new Date(Date.now() + expiration * 1000) };
}

/** Consulta autoritativa da cobrança (fonte de verdade; o webhook é só gatilho). */
export async function getStatus(merchantChargeId: string): Promise<"PAID" | "PENDING" | "FAILED"> {
  const token = await accessToken();
  const res = await fetch(`${BASE_URL}/charge/${encodeURIComponent(merchantChargeId)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { chargeStatus?: string };
  return ppStatusToLocal(json.chargeStatus);
}
