"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Loader2, ShieldCheck, Lock, User, MapPin, ShoppingBag, Gift, Sparkles, Truck, BadgeCheck } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import { trackPixel } from "@/components/MetaPixel";
import { readAttribution } from "@/components/TrackingCapture";

// Máscaras (o servidor já remove não-dígitos; aqui é só UX).
const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
    : d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
const maskCEP = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

type OrderBump = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents?: number;
  image: string | null;
  featured?: boolean;
  headline: string;
};
type Product = { slug: string; name: string; priceCents: number; compareAtCents?: number; image: string; label: string };
type Size = { slug: string; label: string; priceCents: number };

const POLL_SCHEDULE = [0, 3000, 6000, 10000, 15000, 20000, 30000, 45000, 60000];
const POLL_STEADY_STATE = 60000;

type PixState = {
  orderId: string;
  status: string;
  totalCents: number;
  pixCopyPaste: string | null;
  pixExpiresAt: string | null;
};

export default function CheckoutClient({
  product,
  orderBumps,
  sizes,
  shippingDays,
}: {
  product: Product;
  orderBumps: OrderBump[];
  sizes: Size[];
  shippingDays: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(() => {
    const preselect = searchParams.get("bump");
    const match = orderBumps.find((b) => b.slug === preselect);
    return new Set(match ? [match.id] : []);
  });

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    zip: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  // found = CEP achou rua e bairro (mostra só número/complemento); manual = cliente digita o endereço.
  const [addressMode, setAddressMode] = useState<"pending" | "found" | "manual">("pending");

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const purchaseEventId = useMemo(() => crypto.randomUUID(), []);
  const pollIndexRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total =
    product.priceCents + orderBumps.filter((b) => selectedBumps.has(b.id)).reduce((s, b) => s + b.priceCents, 0);

  useEffect(() => {
    // Mesmo eventId no navegador e no servidor → o Meta conta 1 evento só.
    const eventId = crypto.randomUUID();
    trackPixel("InitiateCheckout", { value: total / 100, currency: "BRL" }, eventId);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "initiate_checkout", eventId }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleBump(id: string) {
    setSelectedBumps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function lookupCep(digits: string) {
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("cep");
      setForm((f) => ({
        ...f,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));
      // CEP geral de cidade pequena não traz rua/bairro: aí o cliente completa.
      setAddressMode(data.logradouro && data.bairro ? "found" : "manual");
    } catch {
      setAddressMode("manual");
    } finally {
      setCepLoading(false);
    }
  }

  // Busca o endereço assim que o CEP tem 8 dígitos (sem precisar sair do campo).
  const zipDigits = form.zip.replace(/\D/g, "");
  useEffect(() => {
    if (zipDigits.length === 8) lookupCep(zipDigits);
    else setAddressMode("pending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipDigits]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const attribution = readAttribution();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          mainProductSlug: product.slug,
          orderBumpProductIds: Array.from(selectedBumps),
          customer: { name: form.name, email: form.email, cpf: form.cpf, phone: form.phone },
          shipping: {
            zip: form.zip, address: form.address, number: form.number, complement: form.complement,
            neighborhood: form.neighborhood, city: form.city, state: form.state,
          },
          utm: attribution,
          eventId: purchaseEventId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível gerar o PIX. Tente novamente.");
        setSubmitting(false);
        return;
      }
      setPix(data);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (pix?.pixCopyPaste) {
      QRCode.toDataURL(pix.pixCopyPaste, { width: 280, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [pix?.pixCopyPaste]);

  useEffect(() => {
    if (!pix?.pixExpiresAt) return;
    const tick = () => {
      const diff = new Date(pix.pixExpiresAt!).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pix?.pixExpiresAt]);

  // Polling de fallback: webhook é a fonte de verdade, mas aqui cobrimos
  // o caso do webhook atrasar ou não chegar.
  useEffect(() => {
    if (!pix || pix.status === "PAID") return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${pix!.orderId}/status`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status && data.status !== pix!.status) {
          setPix((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
        if (data.status === "PAID") return; // stop polling
      } catch {
        // tenta de novo no próximo ciclo
      }
      const idx = pollIndexRef.current;
      const delay = POLL_SCHEDULE[idx] ?? POLL_STEADY_STATE;
      pollIndexRef.current = Math.min(idx + 1, POLL_SCHEDULE.length);
      pollTimeoutRef.current = setTimeout(poll, delay);
    }

    poll();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix?.orderId, pix?.status]);

  useEffect(() => {
    // O evento Purchase do Pixel é disparado na página de obrigado
    // (/pedido/sucesso), não aqui — assim a conversão é registrada mesmo que
    // o cliente feche o checkout e volte depois pelo link do pedido.
    if (pix?.status === "PAID") {
      router.push(`/upsell/${pix.orderId}`);
    }
  }, [pix?.status, pix?.orderId, router]);

  function copyPix() {
    if (!pix?.pixCopyPaste) return;
    navigator.clipboard.writeText(pix.pixCopyPaste).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (pix?.pixCopyPaste) {
    return (
      <main className="min-h-screen bg-cream-50 py-8 sm:py-14">
        <div className="container-app max-w-md">
          <div className="overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05]">
            <div className="flex items-center gap-3 border-b border-graphite-900/10 bg-cream-50/70 px-6 py-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                <Image src={product.image} alt={product.name} fill sizes="44px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite-950">{product.name}</p>
                <p className="text-xs text-graphite-700/60">Pedido {pix.orderId}</p>
              </div>
            </div>

            <div className="p-6 text-center sm:p-8">
              {pix.status === "PENDING" || pix.status === "PIX_GENERATED" ? (
                <>
                  <h1 className="text-lg font-extrabold text-graphite-950">Pague com PIX para confirmar</h1>
                  <p className="mt-1 text-sm text-graphite-700/75">Escaneie o QR Code ou copie o código abaixo</p>

                  {qrDataUrl && (
                    <div className="mx-auto mt-5 w-fit rounded-xl2 bg-white p-3 ring-1 ring-graphite-950/[0.08]">
                      <Image src={qrDataUrl} alt="QR Code PIX" width={220} height={220} unoptimized />
                    </div>
                  )}
                  <p className="mt-5 text-3xl font-extrabold tracking-tight text-graphite-950">{formatBRL(pix.totalCents)}</p>

                  {secondsLeft !== null && (
                    <p className="mt-1 text-xs font-medium text-graphite-700/60">
                      {secondsLeft > 0
                        ? `Expira em ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
                        : "PIX expirado — gere um novo pedido"}
                    </p>
                  )}

                  <button onClick={copyPix} className="btn-green mt-6 w-full">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Código copiado!" : "COPIAR CÓDIGO PIX"}
                  </button>

                  <div className="mt-5 flex items-center justify-center gap-2 text-sm text-graphite-700/75">
                    <Loader2 className="h-4 w-4 animate-spin text-sage-600" />
                    Aguardando confirmação do pagamento...
                  </div>

                  <ol className="mt-7 space-y-2 rounded-xl2 bg-cream-50 p-4 text-left text-xs text-graphite-700/80">
                    <li className="flex gap-2"><span className="font-bold text-clay-600">1.</span> Abra o app do seu banco</li>
                    <li className="flex gap-2"><span className="font-bold text-clay-600">2.</span> Escolha pagar via PIX com QR Code ou copia e cola</li>
                    <li className="flex gap-2"><span className="font-bold text-clay-600">3.</span> Confirme o pagamento — a aprovação aqui é automática</li>
                  </ol>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-graphite-700/70">
                    <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-sage-600" /> Compra segura</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-sage-600" /> Garantia total ou seu dinheiro de volta</span>
                  </div>
                </>
              ) : (
                <p className="text-graphite-700/80">
                  Este pedido não está mais disponível para pagamento (status: {pix.status}).
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const selectedBumpList = orderBumps.filter((b) => selectedBumps.has(b.id));
  const showAddressFields = addressMode === "manual";

  return (
    <main className="min-h-screen bg-cream-50 pb-12">
      {/* Cabeçalho enxuto: só a marca e o selo de segurança (sem menus que tiram o foco da compra) */}
      <header className="border-b border-graphite-900/[0.06] bg-white">
        <div className="container-app flex h-16 max-w-5xl items-center justify-between">
          <Link href="/" aria-label="Voltar à loja">
            <Image src="/images/logo.png" alt="Senhor Natal" width={900} height={292} priority className="h-10 w-auto" />
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-bold text-sage-700">
            <Lock className="h-4 w-4" /> Compra 100% segura
          </span>
        </div>
      </header>

      <div className="container-app max-w-5xl pt-5 sm:pt-8">
        {/* O que o cliente está comprando, logo no topo */}
        <section className="mb-5 overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05]">
          <div className="grid sm:grid-cols-[240px_1fr]">
            <div className="relative aspect-[16/10] bg-cream-100 sm:aspect-auto sm:min-h-[240px]">
              <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover" priority />
            </div>
            <div className="p-4 sm:p-6">
              <p className="eyebrow">Você está comprando</p>
              <h1 className="mt-1 text-xl font-extrabold leading-tight text-graphite-950 sm:text-2xl">{product.name}</h1>
              <ul className="mt-3 space-y-1.5 text-sm text-graphite-800">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" strokeWidth={3} /> Já vem decorada, com pisca-pisca e enfeites</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" strokeWidth={3} /> Monta em minutos: encaixa o mastro, puxa e liga</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" strokeWidth={3} /> Bivolt · Frete grátis · Entrega em {shippingDays} dias úteis</li>
              </ul>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  {product.compareAtCents && product.compareAtCents > product.priceCents && (
                    <span className="mr-2 text-sm text-graphite-700/40 line-through">{formatBRL(product.compareAtCents)}</span>
                  )}
                  <span className="text-3xl font-extrabold tracking-tight text-graphite-950">{formatBRL(product.priceCents)}</span>
                  <span className="ml-1 text-xs text-graphite-700/70">no PIX</span>
                </div>
                {sizes.length > 1 && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-graphite-700/60">Tamanho</p>
                    <div className="flex gap-1.5">
                      {sizes.map((sz) => (
                        <Link
                          key={sz.slug}
                          href={`/checkout?tamanho=${sz.slug}`}
                          replace
                          scroll={false}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                            sz.slug === product.slug
                              ? "border-sage-600 bg-sage-600 text-white"
                              : "border-graphite-900/15 bg-white text-graphite-800 hover:border-sage-500"
                          }`}
                        >
                          {sz.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Selos de confiança logo abaixo do item — reforço antes de preencher os dados */}
        <section className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { icon: Lock, label: "Pagamento criptografado" },
            { icon: Truck, label: "Frete grátis p/ todo o Brasil" },
            { icon: ShieldCheck, label: "Garantia de 7 dias" },
            { icon: BadgeCheck, label: "Aprovação na hora" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs font-semibold text-graphite-800 shadow-sm ring-1 ring-graphite-950/[0.05]">
              <Icon className="h-5 w-5 shrink-0 text-sage-600" />
              <span className="leading-tight">{label}</span>
            </div>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <SectionCard icon={User} step={1} title="Seus dados">
              <Input label="Nome completo" value={form.name} onChange={(v) => updateField("name", v)} required placeholder="Como está no seu documento" />
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <Input label="WhatsApp" value={form.phone} onChange={(v) => updateField("phone", maskPhone(v))} required placeholder="(00) 00000-0000" inputMode="tel" hint="Enviamos o rastreio por aqui" />
                <Input label="CPF" value={form.cpf} onChange={(v) => updateField("cpf", maskCPF(v))} required placeholder="000.000.000-00" inputMode="numeric" hint="Exigido para emitir o PIX" />
              </div>
              <Input label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} required placeholder="voce@email.com" inputMode="email" />
            </SectionCard>

            <SectionCard icon={MapPin} step={2} title="Entrega">
              <Input
                label="CEP"
                value={form.zip}
                onChange={(v) => updateField("zip", maskCEP(v))}
                required
                placeholder="00000-000"
                inputMode="numeric"
                loading={cepLoading}
              />
              {addressMode === "pending" && (
                <p className="-mt-2 text-[11px] text-graphite-700/60">
                  Digite o CEP e o endereço aparece sozinho.{" "}
                  <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    Não sei meu CEP
                  </a>
                </p>
              )}

              {addressMode === "found" && (
                <div className="flex items-start gap-3 rounded-xl bg-sage-50 p-3.5 ring-1 ring-sage-200">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold text-graphite-950">{form.address}</p>
                    <p className="text-graphite-700">{form.neighborhood} · {form.city}/{form.state}</p>
                  </div>
                  <button type="button" onClick={() => setAddressMode("manual")} className="shrink-0 text-xs font-semibold text-sage-700 underline underline-offset-2">
                    Alterar
                  </button>
                </div>
              )}

              {showAddressFields && (
                <>
                  <Input label="Endereço (rua, avenida)" value={form.address} onChange={(v) => updateField("address", v)} required />
                  <Input label="Bairro" value={form.neighborhood} onChange={(v) => updateField("neighborhood", v)} required />
                  <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3">
                    <Input label="Cidade" value={form.city} onChange={(v) => updateField("city", v)} required />
                    <Input label="UF" value={form.state} onChange={(v) => updateField("state", v.toUpperCase())} required maxLength={2} />
                  </div>
                </>
              )}

              {addressMode !== "pending" && (
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                  <Input label="Número" value={form.number} onChange={(v) => updateField("number", v)} required inputMode="numeric" />
                  <Input label="Complemento (opcional)" value={form.complement} onChange={(v) => updateField("complement", v)} placeholder="Apto, bloco, casa…" />
                </div>
              )}
            </SectionCard>

            {orderBumps.length > 0 && (
              <SectionCard icon={Sparkles} step={3} title="Aproveite e leve junto" optional>
                <p className="-mt-2 text-xs text-graphite-700/70">Vai no mesmo envio, sem frete extra. É só marcar.</p>
                <div className="space-y-2.5">
                  {orderBumps.map((bump) => (
                    <BumpRow key={bump.id} bump={bump} checked={selectedBumps.has(bump.id)} onToggle={() => toggleBump(bump.id)} highlight={bump.featured} />
                  ))}
                </div>
              </SectionCard>
            )}

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <div className="overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05]">
              <div className="flex items-center gap-2 border-b border-graphite-900/10 px-5 py-3.5">
                <ShoppingBag className="h-4 w-4 text-sage-600" />
                <h2 className="text-sm font-extrabold text-graphite-950">Resumo do pedido</h2>
              </div>

              <div className="p-5">
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                    <Image src={product.image} alt={product.name} fill sizes="80px" className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-graphite-950">{product.name}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      {product.compareAtCents && product.compareAtCents > product.priceCents && (
                        <span className="text-xs text-graphite-700/40 line-through">{formatBRL(product.compareAtCents)}</span>
                      )}
                      <span className="text-sm font-extrabold text-graphite-950">{formatBRL(product.priceCents)}</span>
                    </div>
                  </div>
                </div>

                {selectedBumpList.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-graphite-900/10 pt-4">
                    {selectedBumpList.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm text-graphite-700">
                        <span className="truncate pr-2">{b.name}</span>
                        <span className="shrink-0 font-medium text-graphite-950">{formatBRL(b.priceCents)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-1.5 border-t border-graphite-900/10 pt-4 text-sm">
                  <div className="flex justify-between text-graphite-700/80">
                    <span>Frete</span>
                    <span className="font-medium text-sage-700">Grátis</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-graphite-950">
                    <span>Total</span>
                    <span>{formatBRL(total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-green mt-5 w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {submitting ? "Gerando PIX..." : `PAGAR ${formatBRL(total)} NO PIX`}
                </button>

                <p className="mt-2 text-center text-[11px] text-graphite-700/70">
                  Na próxima tela aparecem o QR Code e o código copia e cola. A aprovação é na hora.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-graphite-700/70">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-sage-600" /> Compra segura</span>
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-sage-600" /> Frete grátis</span>
                  <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-sage-600" /> Garantia de 7 dias</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function BumpRow({
  bump,
  checked,
  onToggle,
  highlight,
}: {
  bump: OrderBump;
  checked: boolean;
  onToggle: () => void;
  highlight?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
        checked
          ? "border-clay-500 bg-clay-50"
          : highlight
            ? "border-sage-400 bg-sage-50 hover:border-sage-500"
            : "border-graphite-900/10 bg-cream-50 hover:border-graphite-900/20"
      }`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 accent-clay-600"
        checked={checked}
        onChange={onToggle}
      />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {bump.image ? (
          <Image src={bump.image} alt={bump.name} fill sizes="48px" className="object-contain" />
        ) : (
          <Gift className="h-6 w-6 text-sage-600" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {highlight && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-sage-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Sparkles className="h-2.5 w-2.5" /> RECOMENDADO
          </span>
        )}
        <p className="text-sm font-bold leading-snug text-graphite-950">{bump.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-graphite-700/70">{bump.headline}</p>
      </div>
      <div className="shrink-0 text-right">
        {bump.compareAtCents && (
          <p className="text-xs text-graphite-700/40 line-through">{formatBRL(bump.compareAtCents)}</p>
        )}
        <p className="text-sm font-extrabold text-graphite-950">{formatBRL(bump.priceCents)}</p>
      </div>
    </label>
  );
}

function SectionCard({
  icon: Icon,
  step,
  title,
  optional,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface min-w-0 p-4 sm:p-6">
      <div className="mb-4 flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-graphite-950 text-xs font-bold leading-none text-cream-50">
          {step}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-sage-600" />
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="truncate text-sm font-extrabold leading-none text-graphite-950">{title}</span>
          {optional && <span className="shrink-0 text-xs font-normal leading-none text-graphite-700/50">(opcional)</span>}
        </div>
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label, value, onChange, onBlur, type = "text", required, placeholder, maxLength, inputMode, loading, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  type?: string; required?: boolean; placeholder?: string; maxLength?: number;
  inputMode?: "numeric" | "tel" | "email" | "text"; loading?: boolean; hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-graphite-700/80">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full min-w-0 rounded-lg border border-graphite-900/15 bg-cream-50 px-3.5 py-3 text-sm text-graphite-950 outline-none transition-shadow ring-sage-500/40 focus:border-sage-500 focus:ring-2"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sage-600" />}
      </div>
      {hint && <span className="mt-1 block text-[11px] text-graphite-700/50">{hint}</span>}
    </label>
  );
}
