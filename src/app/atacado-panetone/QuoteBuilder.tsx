"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, MessageCircle, Loader2, ShieldCheck, Info } from "lucide-react";
import {
  SKUS,
  computeQuote,
  formatBRL,
  formatInt,
  CASEIRO_400_TIERS,
  BUYER_TYPES,
  buildWhatsAppText,
  whatsappHref,
  type Quantities,
} from "@/lib/atacado";
import { readAttribution } from "@/components/TrackingCapture";

const inputCls =
  "w-full rounded-lg border border-graphite-900/15 bg-white px-3 py-2.5 text-sm text-graphite-950 outline-none transition-colors placeholder:text-graphite-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20";

const GROUPS: { key: "caseiro" | "bauducco"; title: string; subtitle: string }[] = [
  {
    key: "caseiro",
    title: "Linha Caseira (artesanal)",
    subtitle: "Produzidos sob encomenda. Quanto mais volume, menor o preço por unidade.",
  },
  {
    key: "bauducco",
    title: "Linha Bauducco (marca)",
    subtitle: "Caixas fechadas da marca que todo mundo conhece — presente que impressiona.",
  },
];

function Stepper({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  const set = (n: number) => onChange(Math.max(0, Math.floor(n)));
  return (
    <div className="flex items-stretch overflow-hidden rounded-full border border-graphite-900/15 bg-white">
      <button
        type="button"
        aria-label="Diminuir"
        onClick={() => set(value - step)}
        className="flex w-10 items-center justify-center text-graphite-700 transition-colors hover:bg-cream-100 active:scale-95"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className="w-14 border-x border-graphite-900/10 bg-transparent text-center text-base font-bold text-graphite-950 outline-none"
      />
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => set(value + step)}
        className="flex w-10 items-center justify-center text-graphite-700 transition-colors hover:bg-cream-100 active:scale-95"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function QuoteBuilder() {
  const [qty, setQty] = useState<Quantities>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [buyerType, setBuyerType] = useState<string>("empresa");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [ack, setAck] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quote = useMemo(() => computeQuote(qty), [qty]);

  const setSku = (id: string, n: number) => setQty((prev) => ({ ...prev, [id]: n }));

  const canSubmit = quote.hasItems && name.trim().length >= 2 && phone.trim().length >= 8 && ack;

  async function handleSubmit() {
    setError(null);
    if (!quote.hasItems) {
      setError("Escolha ao menos um produto para montar o orçamento.");
      return;
    }
    if (name.trim().length < 2 || phone.trim().length < 8) {
      setError("Preencha seu nome e WhatsApp para continuar.");
      return;
    }
    if (!ack) {
      setError("Confirme que entendeu a condição de encomenda com sinal de 50%.");
      return;
    }

    const contact = {
      name: name.trim(),
      phone: phone.trim(),
      buyerType,
      company: company.trim() || null,
      city: city.trim() || null,
      message: message.trim() || null,
    };
    const text = buildWhatsAppText(contact, quote);
    const href = whatsappHref(text);

    setSending(true);
    // Salva o lead ANTES de abrir o WhatsApp (captura garantida). Se falhar,
    // não perde a venda: segue pro WhatsApp mesmo assim.
    try {
      await fetch("/api/atacado/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          quantities: qty,
          attribution: readAttribution(),
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }

    // Dispara evento de Lead pro(s) pixel(s) já instalados no site.
    try {
      const w = window as unknown as { fbq?: (...args: unknown[]) => void };
      if (typeof w.fbq === "function") {
        w.fbq("track", "Lead", { value: quote.totalCents / 100, currency: "BRL" });
      }
    } catch {
      /* ok */
    }

    window.location.href = href;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
      {/* Coluna de seleção */}
      <div className="space-y-8">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <div className="mb-3">
              <h3 className="text-lg font-extrabold text-graphite-950">{group.title}</h3>
              <p className="text-sm text-graphite-600">{group.subtitle}</p>
            </div>

            {group.key === "caseiro" && (
              <div className="mb-4 overflow-hidden rounded-xl2 border border-sage-200 bg-sage-50">
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-sage-700">
                  <Info className="h-3.5 w-3.5" /> Tabela por volume — Panetone e Chocotone 400g
                </div>
                <div className="grid grid-cols-2 gap-px bg-sage-200 sm:grid-cols-4">
                  {CASEIRO_400_TIERS.map((t) => {
                    const active = quote.tier?.label === t.label;
                    return (
                      <div
                        key={t.label}
                        className={`bg-white px-3 py-2 text-center ${active ? "ring-2 ring-inset ring-sage-500" : ""}`}
                      >
                        <div className="text-[11px] font-semibold text-graphite-600">{t.label}</div>
                        <div className="text-sm font-extrabold text-sage-700">{formatBRL(t.cents)}</div>
                        {active && <div className="text-[10px] font-bold text-sage-600">sua faixa</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {SKUS.filter((s) => s.group === group.key).map((sku) => {
                const q = qty[sku.id] ?? 0;
                const unitCents =
                  sku.priceMode === "tiered400"
                    ? (quote.tier ?? CASEIRO_400_TIERS[0]).cents
                    : sku.fixedCents ?? 0;
                const lineTotal = unitCents * q;
                return (
                  <div
                    key={sku.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl2 bg-white p-3 shadow-card ring-1 ring-graphite-950/[0.04] sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-tight text-graphite-950">{sku.name}</p>
                      <p className="text-xs text-graphite-600">{sku.detail}</p>
                      <p className="mt-0.5 text-sm font-semibold text-clay-600">
                        {formatBRL(unitCents)}
                        <span className="text-xs font-medium text-graphite-500">
                          {sku.unit === "cx" ? ` / caixa (${sku.boxSize} un)` : " / unidade"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stepper value={q} onChange={(n) => setSku(sku.id, n)} />
                      <div className="w-20 text-right text-sm font-extrabold text-graphite-950">
                        {q > 0 ? formatBRL(lineTotal) : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Coluna do resumo + formulário (sticky no desktop) */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="card-surface overflow-hidden">
          <div className="bg-graphite-950 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-cream-200">Seu orçamento</p>
            <div className="mt-1 flex items-end justify-between">
              <span className="text-3xl font-extrabold">{formatBRL(quote.totalCents)}</span>
              {quote.totalPieces > 0 && (
                <span className="pb-1 text-xs text-cream-200">{formatInt(quote.totalPieces)} panetones</span>
              )}
            </div>
            {quote.totalCents > 0 && (
              <p className="mt-1 text-xs text-sage-200">
                Sinal de 50% p/ iniciar: <strong>{formatBRL(quote.sinalCents)}</strong>
              </p>
            )}
          </div>

          <div className="max-h-44 overflow-y-auto px-5 py-3 text-sm">
            {quote.lines.length === 0 ? (
              <p className="py-4 text-center text-graphite-500">
                Monte seu pedido ao lado 👆<br />O total aparece aqui na hora.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {quote.lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span className="text-graphite-700">
                      {formatInt(l.qty)}× {l.name}
                    </span>
                    <span className="font-semibold text-graphite-950">{formatBRL(l.totalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulário */}
          <div className="space-y-3 border-t border-graphite-900/10 bg-cream-25 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome*"
                className={inputCls}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp (DDD)*"
                inputMode="tel"
                className={inputCls}
              />
            </div>
            <select
              value={buyerType}
              onChange={(e) => setBuyerType(e.target.value)}
              className={inputCls}
            >
              {BUYER_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Empresa / instituição"
                className={inputCls}
              />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className={inputCls}
              />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Observação (prazo, data de entrega, dúvida...)"
              rows={2}
              className={`${inputCls} resize-none`}
            />

            <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-cream-100 p-3 text-xs text-graphite-700">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-sage-600"
              />
              <span>
                Entendi que os panetones são <strong>produzidos sob encomenda</strong> e que um{" "}
                <strong>sinal de 50%</strong> inicia a produção do meu pedido.
              </span>
            </label>

            {error && <p className="text-xs font-semibold text-clay-600">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || sending}
              className="btn-green w-full !py-4 text-base"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp e fechar
                </>
              )}
            </button>
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-graphite-500">
              <ShieldCheck className="h-3.5 w-3.5 text-sage-600" /> Atendimento humano · resposta rápida ·
              sem compromisso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
