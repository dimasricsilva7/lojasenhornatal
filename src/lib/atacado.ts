/**
 * Campanha ATACADO DE PANETONE — Senhor Natal
 * Módulo central de preços e orçamento. É importado pela página (calculadora),
 * pela API (recalcula o total no servidor — nunca confia no cliente) e pela
 * montagem da mensagem de WhatsApp. Mantém tudo em centavos pra evitar erro de
 * ponto flutuante.
 */

export const WHATSAPP_NUMBER = "5511916704226"; // +55 11 91670-4226
export const CAMPAIGN = "atacado-panetone";

/** Percentual do sinal para iniciar a produção/separação do pedido. */
export const SINAL_PCT = 0.5;

/* ------------------------------------------------------------------ */
/* Tabela de preço por volume dos CASEIROS 400g (preço por unidade)    */
/* ------------------------------------------------------------------ */

export type Tier = { min: number; max: number | null; cents: number; label: string };

/** A faixa é definida pelo TOTAL de unidades caseiras 400g (panetone + chocotone). */
export const CASEIRO_400_TIERS: Tier[] = [
  { min: 1, max: 100, cents: 665, label: "Até 100 un" },
  { min: 101, max: 500, cents: 589, label: "101 a 500 un" },
  { min: 501, max: 1000, cents: 492, label: "501 a 1.000 un" },
  { min: 1001, max: null, cents: 387, label: "Acima de 1.000 un" },
];

/** Pedido mínimo da campanha, em unidades (peças de panetone). */
export const MIN_PIECES = 50;

export function tierForQty(qty: number): Tier {
  if (qty <= 0) return CASEIRO_400_TIERS[0];
  return (
    CASEIRO_400_TIERS.find((t) => qty >= t.min && (t.max === null || qty <= t.max)) ??
    CASEIRO_400_TIERS[CASEIRO_400_TIERS.length - 1]
  );
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

export type SkuGroup = "caseiro" | "bauducco";
export type PriceMode = "tiered400" | "fixed";

export type Sku = {
  id: string;
  group: SkuGroup;
  name: string;
  /** Descrição curta exibida no card. */
  detail: string;
  /** "un" = vendido por unidade; "cx" = vendido por caixa fechada. */
  unit: "un" | "cx";
  /** Quantas unidades vêm na caixa (só p/ unit = "cx"). */
  boxSize?: number;
  priceMode: PriceMode;
  /** Preço fixo em centavos (p/ priceMode = "fixed"). */
  fixedCents?: number;
};

export const SKUS: Sku[] = [
  // ---- CASEIROS (produzidos sob encomenda) ----
  {
    id: "cas_pan_400",
    group: "caseiro",
    name: "Panetone caseiro 400g",
    detail: "Frutas cristalizadas e passas · massa artesanal",
    unit: "un",
    priceMode: "tiered400",
  },
  {
    id: "cas_cho_400",
    group: "caseiro",
    name: "Chocotone caseiro 400g",
    detail: "Recheado com gotas de chocolate · massa artesanal",
    unit: "un",
    priceMode: "tiered400",
  },
  {
    id: "cas_mini_pan",
    group: "caseiro",
    name: "Mini panetone caseiro 100g",
    detail: "Caixa fechada com 24 unidades",
    unit: "cx",
    boxSize: 24,
    priceMode: "fixed",
    fixedCents: 6490,
  },
  {
    id: "cas_mini_cho",
    group: "caseiro",
    name: "Mini chocotone caseiro 100g",
    detail: "Caixa fechada com 24 unidades",
    unit: "cx",
    boxSize: 24,
    priceMode: "fixed",
    fixedCents: 6490,
  },
  // ---- BAUDUCCO (marca, caixas fechadas) ----
  {
    id: "bau_pan_400",
    group: "bauducco",
    name: "Panetone Bauducco 400g",
    detail: "Caixa fechada com 10 unidades",
    unit: "cx",
    boxSize: 10,
    priceMode: "fixed",
    fixedCents: 14490,
  },
  {
    id: "bau_cho_400",
    group: "bauducco",
    name: "Chocotone Bauducco 400g",
    detail: "Caixa fechada com 10 unidades",
    unit: "cx",
    boxSize: 10,
    priceMode: "fixed",
    fixedCents: 15490,
  },
  {
    id: "bau_mini_pan",
    group: "bauducco",
    name: "Mini panetone Bauducco 80g",
    detail: "Caixa fechada com 24 unidades",
    unit: "cx",
    boxSize: 24,
    priceMode: "fixed",
    fixedCents: 7490,
  },
  {
    id: "bau_mini_cho",
    group: "bauducco",
    name: "Mini chocotone Bauducco 80g",
    detail: "Caixa fechada com 24 unidades",
    unit: "cx",
    boxSize: 24,
    priceMode: "fixed",
    fixedCents: 8690,
  },
];

export const SKU_BY_ID: Record<string, Sku> = Object.fromEntries(SKUS.map((s) => [s.id, s]));

export type Quantities = Record<string, number>;

export type QuoteLine = {
  id: string;
  name: string;
  group: SkuGroup;
  unit: "un" | "cx";
  boxSize?: number;
  qty: number; // quantidade escolhida (de unidades ou de caixas)
  unitCents: number; // preço da unidade OU da caixa
  totalCents: number;
  /** total de panetones que essa linha representa (caixa conta boxSize). */
  pieces: number;
};

export type Quote = {
  lines: QuoteLine[];
  caseiro400Units: number;
  tier: Tier | null;
  subtotalCents: number;
  totalCents: number;
  sinalCents: number;
  totalPieces: number;
  hasItems: boolean;
  /** pedido atingiu o mínimo de MIN_PIECES unidades. */
  meetsMinimum: boolean;
  /** quantas peças ainda faltam p/ o mínimo (0 se já atingiu). */
  piecesToMinimum: number;
};

function sanitizeQty(v: unknown): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 1_000_000); // trava anti-absurdo
}

export function computeQuote(raw: Quantities): Quote {
  const q: Quantities = {};
  for (const sku of SKUS) q[sku.id] = sanitizeQty(raw?.[sku.id]);

  const caseiro400Units = q["cas_pan_400"] + q["cas_cho_400"];
  const tier = caseiro400Units > 0 ? tierForQty(caseiro400Units) : null;

  const lines: QuoteLine[] = [];
  for (const sku of SKUS) {
    const qty = q[sku.id];
    if (qty <= 0) continue;

    const unitCents =
      sku.priceMode === "tiered400" ? tierForQty(caseiro400Units).cents : sku.fixedCents ?? 0;
    const totalCents = unitCents * qty;
    const pieces = sku.unit === "cx" ? qty * (sku.boxSize ?? 1) : qty;

    lines.push({
      id: sku.id,
      name: sku.name,
      group: sku.group,
      unit: sku.unit,
      boxSize: sku.boxSize,
      qty,
      unitCents,
      totalCents,
      pieces,
    });
  }

  const subtotalCents = lines.reduce((acc, l) => acc + l.totalCents, 0);
  const totalPieces = lines.reduce((acc, l) => acc + l.pieces, 0);
  const totalCents = subtotalCents;
  const sinalCents = Math.ceil(totalCents * SINAL_PCT);

  return {
    lines,
    caseiro400Units,
    tier,
    subtotalCents,
    totalCents,
    sinalCents,
    totalPieces,
    hasItems: lines.length > 0,
    meetsMinimum: totalPieces >= MIN_PIECES,
    piecesToMinimum: Math.max(0, MIN_PIECES - totalPieces),
  };
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

/* ------------------------------------------------------------------ */
/* Tipos de comprador                                                  */
/* ------------------------------------------------------------------ */

export const BUYER_TYPES = [
  { value: "empresa", label: "Empresa (brindes de Natal)" },
  { value: "doacao", label: "Doação / caridade" },
  { value: "revenda", label: "Revenda" },
  { value: "pessoal", label: "Consumo próprio / família" },
] as const;

export type BuyerType = (typeof BUYER_TYPES)[number]["value"];

export function buyerLabel(value: string): string {
  return BUYER_TYPES.find((b) => b.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/* Mensagem de WhatsApp                                                */
/* ------------------------------------------------------------------ */

export type LeadContact = {
  name: string;
  phone: string;
  buyerType: string;
  company?: string | null;
  city?: string | null;
  message?: string | null;
};

export function buildWhatsAppText(contact: LeadContact, quote: Quote): string {
  const L: string[] = [];
  L.push("Olá, Senhor Natal! 🎄 Quero finalizar meu pedido de ATACADO de panetones.");
  L.push("");
  L.push(`👤 *${contact.name}*`);
  const tipo = buyerLabel(contact.buyerType);
  L.push(`🏷️ ${tipo}${contact.company ? ` — ${contact.company}` : ""}`);
  if (contact.city) L.push(`📍 ${contact.city}`);
  L.push("");
  L.push("📦 *Meu orçamento:*");
  for (const l of quote.lines) {
    const un = l.unit === "cx" ? `cx c/ ${l.boxSize}` : "un";
    L.push(
      `• ${formatInt(l.qty)}x ${l.name} — ${formatBRL(l.unitCents)}/${un} = ${formatBRL(l.totalCents)}`
    );
  }
  L.push("━━━━━━━━━━━━━━");
  L.push(`💰 *Total estimado: ${formatBRL(quote.totalCents)}*`);
  L.push(`🤝 Sinal 50% p/ iniciar: ${formatBRL(quote.sinalCents)}`);
  if (contact.message) {
    L.push("");
    L.push(`📝 Observação: ${contact.message}`);
  }
  L.push("");
  L.push(
    "Estou ciente de que o pedido é sob encomenda e que o sinal de 50% inicia a produção. Quero combinar os detalhes e pagar o sinal. ✅"
  );
  return L.join("\n");
}

export function whatsappHref(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ------------------------------------------------------------------ */
/* Status de lead (usado no admin)                                     */
/* ------------------------------------------------------------------ */

export const LEAD_STATUSES = [
  { value: "NOVO", label: "Novo", tone: "bg-clay-100 text-clay-700" },
  { value: "CONTATADO", label: "Em contato", tone: "bg-cream-200 text-graphite-800" },
  { value: "ORCAMENTO", label: "Orçamento enviado", tone: "bg-sage-100 text-sage-700" },
  { value: "SINAL_PAGO", label: "Sinal pago", tone: "bg-sage-500 text-white" },
  { value: "FECHADO", label: "Fechado ✅", tone: "bg-sage-600 text-white" },
  { value: "PERDIDO", label: "Perdido", tone: "bg-graphite-600 text-white" },
] as const;

export function statusMeta(value: string) {
  return LEAD_STATUSES.find((s) => s.value === value) ?? LEAD_STATUSES[0];
}
