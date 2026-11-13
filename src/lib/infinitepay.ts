const BASE_URL = process.env.INFINITEPAY_BASE_URL ?? "https://api.checkout.infinitepay.io";

function apiKey(): string {
  const key = process.env.INFINITEPAY_API_KEY;
  if (!key) throw new Error("INFINITEPAY_API_KEY não configurada");
  return key;
}

/** InfiniteTag da conta (sem o "$"), ex.: tainan-vitor-lnt. Usada no payment_check. */
function handle(): string {
  const h = process.env.INFINITEPAY_HANDLE;
  if (!h) throw new Error("INFINITEPAY_HANDLE não configurado");
  return h;
}

export class InfinitePayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Cria um link de checkout hospedado (cartão + PIX, sem boleto) e devolve a URL
 * para onde o comprador é redirecionado. `price` é em CENTAVOS. A InfinitePay
 * deduplica requisições idênticas (mesmo valor/itens) devolvendo o MESMO link —
 * por isso a descrição inclui o id do pedido, garantindo um link único por pedido.
 */
export async function createCheckoutLink(input: {
  amountCents: number;
  description: string;
  orderNsu: string;
  redirectUrl: string;
  webhookUrl: string;
  customer?: { name: string; email: string; phone: string };
}): Promise<string> {
  const body = {
    items: [{ description: input.description.slice(0, 200), price: input.amountCents, quantity: 1 }],
    order_nsu: input.orderNsu,
    redirect_url: input.redirectUrl,
    webhook_url: input.webhookUrl,
    ...(input.customer
      ? {
          customer: {
            name: input.customer.name,
            email: input.customer.email,
            phone_number: `+55${input.customer.phone.replace(/\D/g, "")}`,
          },
        }
      : {}),
    // Cartão + PIX apenas (boleto fica de fora). O objeto `options` exige a API key.
    options: { payment_methods_enabled: ["credit_card", "pix"] },
  };

  const res = await fetch(`${BASE_URL}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new InfinitePayError(json.message ?? json.error ?? `InfinitePay /links falhou (${res.status})`, res.status);
  }
  return json.url;
}

export type InfinitePayCheck = {
  success: boolean;
  paid: boolean;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
};

/**
 * Confirma um pagamento no servidor. O redirect e o webhook da InfinitePay NÃO
 * são assinados, então nada é marcado como pago sem passar por aqui. slug e
 * transaction_nsu vêm do webhook (invoice_slug/transaction_nsu) ou do redirect.
 */
export async function checkPayment(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<InfinitePayCheck> {
  const res = await fetch(`${BASE_URL}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey() },
    body: JSON.stringify({
      handle: handle(),
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as InfinitePayCheck;
  return {
    success: Boolean(json.success),
    paid: Boolean(json.paid),
    amount: json.amount,
    paid_amount: json.paid_amount,
    installments: json.installments,
    capture_method: json.capture_method,
  };
}
