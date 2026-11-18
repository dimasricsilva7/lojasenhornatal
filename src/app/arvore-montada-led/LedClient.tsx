"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { trackPixel } from "@/components/MetaPixel";
import type { LedItem } from "@/lib/led/config";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

type Props = {
  main: { slug: string; name: string; priceCents: number; compareAtCents: number };
  bumps: LedItem[];
  upsells: LedItem[];
};

type Step = "closed" | "form" | "pix";

export default function LedClient({ main, bumps, upsells }: Props) {
  const [step, setStep] = useState<Step>("closed");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const eventId = useRef<string>("");

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    zip: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ displayId: string; copyPaste: string | null; total: number } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  const addons = useMemo(() => [...bumps, ...upsells], [bumps, upsells]);
  const selectedSlugs = addons.filter((a) => selected[a.slug]).map((a) => a.slug);
  const total = main.priceCents + addons.filter((a) => selected[a.slug]).reduce((s, a) => s + a.priceCents, 0);

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

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (!d.erro) setForm((f) => ({ ...f, address: d.logradouro || f.address, neighborhood: d.bairro || f.neighborhood, city: d.localidade || f.city, state: d.uf || f.state }));
    } catch { /* silencioso */ }
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
        if (d.status === "PAID") { setPaid(true); window.location.href = `/pedido/sucesso/${pix.displayId}`; }
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

  const canSubmit = form.name.length > 2 && /\S+@\S+/.test(form.email) && form.cpf.replace(/\D/g, "").length === 11 && form.phone.replace(/\D/g, "").length >= 10 && form.zip.replace(/\D/g, "").length === 8 && form.address && form.number && form.neighborhood && form.city && form.state.length === 2;

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
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-lg font-extrabold text-graphite-950">Finalize seu pedido</h3>

                {/* Order bumps + upsells */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">Leve junto (opcional)</p>
                  {addons.map((a) => (
                    <label key={a.slug} className={`led-addon ${selected[a.slug] ? "led-addon-on" : ""}`}>
                      <input type="checkbox" checked={!!selected[a.slug]} onChange={() => toggle(a.slug, a.priceCents)} />
                      <img src={a.image} alt="" loading="lazy" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium leading-tight text-graphite-950">{a.name}</span>
                        <span className="text-sm font-bold text-emerald-700">+ {brl(a.priceCents)}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Input label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                    <Input label="WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(11) 90000-0000" />
                  </div>
                  <Input label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} placeholder="000.000.000-00" />
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="CEP" value={form.zip} onChange={(v) => { setForm({ ...form, zip: v }); }} onBlur={() => lookupCep(form.zip)} />
                    <div className="col-span-2"><Input label="Endereço" value={form.address} onChange={(v) => setForm({ ...form, address: v })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Número" value={form.number} onChange={(v) => setForm({ ...form, number: v })} />
                    <div className="col-span-2"><Input label="Complemento" value={form.complement} onChange={(v) => setForm({ ...form, complement: v })} /></div>
                  </div>
                  <Input label="Bairro" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Input label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} /></div>
                    <Input label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v.toUpperCase().slice(0, 2) })} />
                  </div>
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <div className="flex items-center justify-between border-t border-graphite-900/10 pt-3">
                  <span className="text-sm text-graphite-600">Total</span>
                  <span className="text-xl font-extrabold text-graphite-950">{brl(total)}</span>
                </div>
                <button type="submit" disabled={!canSubmit || loading} className="led-btn-primary w-full disabled:opacity-50">
                  {loading ? "Gerando PIX…" : `Gerar PIX · ${brl(total)}`}
                </button>
                <p className="text-center text-xs text-graphite-500">Pagamento via PIX · aprovação na hora · dados protegidos</p>
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

function Input({ label, value, onChange, type = "text", placeholder, onBlur }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; onBlur?: () => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-graphite-600">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className="w-full rounded-lg border border-graphite-900/15 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20" />
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
