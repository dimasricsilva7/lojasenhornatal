"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Lock, Check, Loader2, ShieldCheck, Truck, Zap, QrCode } from "lucide-react";
import { trackPixel } from "@/components/MetaPixel";
import type { LedItem } from "@/lib/led/config";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const digits = (s: string) => s.replace(/\D/g, "");
const maskCPF = (s: string) =>
  digits(s).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (s: string) => {
  const d = digits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};
const maskCEP = (s: string) => digits(s).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

type Props = {
  main: { slug: string; name: string; priceCents: number; compareAtCents: number; image?: string };
  bumps: LedItem[];
  upsells: LedItem[];
};

type Step = "closed" | "form" | "pix";

export default function LedClient({ main, bumps, upsells }: Props) {
  const [step, setStep] = useState<Step>("closed");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const eventId = useRef<string>("");
  const numberRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    zip: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ displayId: string; copyPaste: string | null; total: number } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  const addons = useMemo(() => [...bumps, ...upsells], [bumps, upsells]);
  const selectedSlugs = addons.filter((a) => selected[a.slug]).map((a) => a.slug);
  const extras = addons.filter((a) => selected[a.slug]).reduce((s, a) => s + a.priceCents, 0);
  const total = main.priceCents + extras;

  function openCheckout() {
    eventId.current = uuid();
    trackPixel("InitiateCheckout", { value: total / 100, currency: "BRL", content_ids: [main.slug] }, eventId.current);
    setStep("form");
    setError(null);
  }

  function toggle(slug: string, price: number) {
    setSelected((s) => {
      const next = { ...s, [slug]: !s[slug] };
      if (!s[slug]) trackPixel("AddToCart", { value: price / 100, currency: "BRL", content_ids: [slug] });
      return next;
    });
  }

  async function lookupCep(cepRaw: string) {
    const clean = digits(cepRaw);
    if (clean.length !== 8) return;
    setCepStatus("loading");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (d.erro) { setCepStatus("fail"); return; }
      setForm((f) => ({
        ...f,
        address: d.logradouro || f.address,
        neighborhood: d.bairro || f.neighborhood,
        city: d.localidade || f.city,
        state: d.uf || f.state,
      }));
      setCepStatus("ok");
      setTimeout(() => numberRef.current?.focus(), 60);
    } catch { setCepStatus("fail"); }
  }

  function onCepChange(v: string) {
    const masked = maskCEP(v);
    setForm((f) => ({ ...f, zip: masked }));
    if (cepStatus !== "idle") setCepStatus("idle");
    if (digits(masked).length === 8) lookupCep(masked);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/led/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: uuid(),
          addonSlugs: selectedSlugs,
          eventId: eventId.current,
          customer: { name: form.name, email: form.email, cpf: form.cpf, phone: form.phone },
          shipping: { zip: form.zip, address: form.address, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state },
          utm: readAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Não foi possível gerar o PIX. Confira os dados."); setLoading(false); return; }
      setPix({ displayId: data.orderId, copyPaste: data.pixCopyPaste, total: data.totalCents });
      setStep("pix");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  // Polling do status: busca o copia-e-cola (gerado em segundos) e detecta pagamento.
  useEffect(() => {
    if (step !== "pix" || !pix) return;
    let active = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/orders/${pix.displayId}/status`);
        const d = await r.json();
        if (!active) return;
        if (d.pixCopyPaste && !pix.copyPaste) setPix((p) => (p ? { ...p, copyPaste: d.pixCopyPaste } : p));
        if (d.status === "PAID") { setPaid(true); window.location.href = `/arvore-montada-led/oferta/${pix.displayId}`; }
      } catch { /* continua */ }
    };
    const id = setInterval(tick, 4000);
    tick();
    return () => { active = false; clearInterval(id); };
  }, [step, pix]);

  // QR code a partir do copia-e-cola.
  useEffect(() => {
    if (!pix?.copyPaste) return;
    import("qrcode").then((QR) => QR.toDataURL(pix.copyPaste as string, { width: 240, margin: 1 }).then(setQr).catch(() => {}));
  }, [pix?.copyPaste]);

  const canSubmit =
    form.name.trim().length > 2 && /\S+@\S+\.\S+/.test(form.email) && digits(form.cpf).length === 11 &&
    digits(form.phone).length >= 10 && digits(form.zip).length === 8 && !!form.address && !!form.number &&
    !!form.neighborhood && !!form.city && form.state.length === 2;

  return (
    <>
      {/* Botão fixo de compra */}
      <button onClick={openCheckout} className="led-cta-fixed">
        QUERO A MINHA ÁRVORE · {brl(main.priceCents)}
      </button>

      {/* Gatilho reutilizável via evento custom */}
      <BuyTriggers onBuy={openCheckout} />

      {step !== "closed" && (
        <div className="led-overlay" onClick={() => step !== "pix" && setStep("closed")}>
          <div className="led-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="led-close" onClick={() => setStep("closed")} aria-label="Fechar">×</button>

            {step === "form" && (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-graphite-950">Finalize seu pedido</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-graphite-500">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" /> Pagamento 100% seguro · leva menos de 1 minuto
                  </p>
                </div>

                {/* Resumo do pedido */}
                <div className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3 ring-1 ring-graphite-900/5">
                  {main.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={main.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-graphite-950 line-clamp-2">{main.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-base font-extrabold text-[#c0392b]">{brl(main.priceCents)}</span>
                      <span className="text-xs text-graphite-400 line-through">{brl(main.compareAtCents)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">FRETE GRÁTIS</span>
                    </div>
                  </div>
                </div>

                {/* Order bumps (os upsells são oferecidos DEPOIS da compra, não aqui). */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-graphite-950">🎁 Aproveite e leve junto</p>
                  {bumps.map((a) => {
                    const on = !!selected[a.slug];
                    return (
                      <button
                        key={a.slug}
                        type="button"
                        onClick={() => toggle(a.slug, a.priceCents)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] p-2.5 text-left transition ${on ? "border-emerald-500 bg-emerald-50" : "border-graphite-900/10 bg-white hover:border-graphite-900/20"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold leading-tight text-graphite-950">{a.name}</span>
                          <span className="text-sm font-bold text-emerald-700">+ {brl(a.priceCents)}</span>
                        </span>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${on ? "border-emerald-500 bg-emerald-500 text-white" : "border-graphite-300"}`}>
                          {on && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Seus dados */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-graphite-500">Seus dados</p>
                  <Input label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" placeholder="Seu nome" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="E-mail" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="voce@email.com" />
                    <Input label="WhatsApp" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: maskPhone(v) })} placeholder="(11) 90000-0000" />
                  </div>
                  <Input label="CPF" inputMode="numeric" autoComplete="off" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: maskCPF(v) })} placeholder="000.000.000-00" />
                </div>

                {/* Entrega */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-graphite-500">Endereço de entrega</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="CEP" inputMode="numeric" autoComplete="postal-code" value={form.zip}
                      onChange={onCepChange} onBlur={() => lookupCep(form.zip)} placeholder="00000-000"
                      right={cepStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin text-graphite-400" /> : cepStatus === "ok" ? <Check className="h-4 w-4 text-emerald-600" /> : undefined}
                    />
                    <div className="col-span-2"><Input label="Endereço" autoComplete="address-line1" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Rua / Avenida" /></div>
                  </div>
                  {cepStatus === "fail" && <p className="-mt-1 text-xs text-amber-700">CEP não encontrado — preencha o endereço manualmente.</p>}
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Número" inputMode="numeric" autoComplete="off" value={form.number} onChange={(v) => setForm({ ...form, number: v })} inputRef={numberRef} placeholder="123" />
                    <div className="col-span-2"><Input label="Complemento" value={form.complement} onChange={(v) => setForm({ ...form, complement: v })} placeholder="Apto, bloco (opcional)" /></div>
                  </div>
                  <Input label="Bairro" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} placeholder="Seu bairro" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Input label="Cidade" autoComplete="address-level2" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Sua cidade" /></div>
                    <Input label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) })} placeholder="SP" />
                  </div>
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

                {/* Rodapé fixo com total + CTA */}
                <div className="sticky bottom-0 z-10 -mx-[22px] -mb-[22px] border-t border-graphite-900/10 bg-white/95 px-[22px] pb-5 pt-3 backdrop-blur">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-graphite-600">Total {extras > 0 ? "(com extras)" : ""}</span>
                    <span className="text-xl font-extrabold text-graphite-950">{brl(total)}</span>
                  </div>
                  <button type="submit" disabled={!canSubmit || loading} className="led-btn-primary flex w-full items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:opacity-50">
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Gerando PIX…</> : <><QrCode className="h-5 w-5" /> Pagar com PIX · {brl(total)}</>}
                  </button>
                  <div className="mt-2 flex items-center justify-center gap-3 text-[11px] font-medium text-graphite-500">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Compra segura</span>
                    <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> Aprovação na hora</span>
                    <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-graphite-500" /> Frete grátis</span>
                  </div>
                </div>
              </form>
            )}

            {step === "pix" && pix && (
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-extrabold text-graphite-950">{paid ? "Pagamento aprovado!" : "Escaneie para pagar"}</h3>
                {!paid && (
                  <>
                    <p className="text-sm text-graphite-600">Valor: <strong>{brl(pix.total)}</strong> · pague com o PIX do seu banco</p>
                    {qr ? <img src={qr} alt="QR Code PIX" className="mx-auto h-56 w-56 rounded-lg ring-1 ring-graphite-900/10" /> : <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg bg-cream-100 text-sm text-graphite-500">Gerando QR…</div>}
                    {pix.copyPaste ? (
                      <>
                        <div className="break-all rounded-lg bg-cream-100 px-3 py-2 text-xs text-graphite-700">{pix.copyPaste}</div>
                        <button onClick={() => { navigator.clipboard.writeText(pix.copyPaste as string); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="led-btn-primary w-full">
                          {copied ? "Código copiado!" : "Copiar código PIX"}
                        </button>
                      </>
                    ) : <p className="text-sm text-graphite-500">Gerando seu código PIX…</p>}
                    <p className="text-xs text-graphite-500">Assim que o pagamento cair, esta tela avança sozinha.</p>
                  </>
                )}
                {paid && <p className="text-emerald-700">Redirecionando para o seu pedido…</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Input({
  label, value, onChange, type = "text", placeholder, onBlur, inputMode, autoComplete, right, inputRef, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  onBlur?: () => void;
  inputMode?: "text" | "numeric" | "email" | "tel";
  autoComplete?: string;
  right?: React.ReactNode;
  inputRef?: React.RefObject<HTMLInputElement>;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-graphite-600">{label}</span>
      <div className="relative">
        {/* text-base (16px) evita o zoom automático do iOS ao focar o campo */}
        <input
          ref={inputRef}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full rounded-xl border border-graphite-900/15 bg-white px-3.5 py-3 text-base text-graphite-950 outline-none transition placeholder:text-graphite-400 focus:border-[#c0392b] focus:ring-2 focus:ring-[#c0392b]/15"
        />
        {right && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
    </label>
  );
}

// Permite que qualquer botão "comprar" da página abra o checkout via evento custom.
function BuyTriggers({ onBuy }: { onBuy: () => void }) {
  useEffect(() => {
    const h = () => onBuy();
    window.addEventListener("led:buy", h);
    return () => window.removeEventListener("led:buy", h);
  }, [onBuy]);
  return null;
}

function readAttribution() {
  if (typeof document === "undefined") return {};
  try {
    const m = document.cookie.match(/(?:^|; )attribution=([^;]+)/);
    if (!m) return {};
    return JSON.parse(decodeURIComponent(m[1]));
  } catch { return {}; }
}

// Botão de compra reutilizável no corpo da página (dispara o checkout).
export function BuyButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("led:buy"))}>
      {children}
    </button>
  );
}
