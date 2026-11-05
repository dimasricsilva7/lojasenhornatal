"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { formatBRL } from "@/lib/pricing";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  images: string[];
  type: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  orderBumpEnabled: boolean;
  orderBumpPriceCents: number | null;
  orderBumpHeadline: string | null;
  upsellEnabled: boolean;
  upsellPriceCents: number | null;
  upsellHeadline: string | null;
  shortPitch: string | null;
};

const GROUPS: { type: string; title: string; help: string }[] = [
  { type: "MAIN", title: "Tamanhos da árvore", help: "Cada tamanho é um produto, do menor (ordem 1) para o maior. O maior é o destino do upgrade. O marcado como Destaque abre selecionado com o selo \"Mais escolhida\"." },
  { type: "ORDER_BUMP", title: "Order bumps (no checkout)", help: "Aparecem como caixinhas para marcar no checkout. Recomendado: no máximo 2 ativos." },
  { type: "UPSELL", title: "Upsells (logo após o pagamento)", help: "TODOS os ativos aparecem em sequência, na ordem da lista. Não contam como nova compra no Meta." },
  { type: "DOWNSELL", title: "Downsells (depois dos upsells)", help: "TODOS os ativos aparecem em sequência, depois dos upsells. Não contam como nova compra no Meta." },
  { type: "COMPLEMENTARY", title: "Outros produtos", help: "" },
];

const field = "w-full rounded-lg border border-graphite-900/15 px-3 py-1.5 text-sm";

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((list: Product[]) => setProducts(list.sort((a, b) => a.sortOrder - b.sortOrder)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function update(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function save(p: Product) {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
          compareAtCents: p.compareAtCents,
          images: p.images,
          active: p.active,
          featured: p.featured,
          orderBumpEnabled: p.orderBumpEnabled,
          orderBumpPriceCents: p.orderBumpPriceCents,
          orderBumpHeadline: p.orderBumpHeadline,
          upsellEnabled: p.upsellEnabled,
          upsellPriceCents: p.upsellPriceCents,
          upsellHeadline: p.upsellHeadline,
          shortPitch: p.shortPitch,
          sortOrder: p.sortOrder,
        }),
      });
      if (!res.ok) {
        alert("Não foi possível salvar. Confira se o preço está preenchido e maior que zero.");
        return;
      }
      setSavedId(p.id);
      setTimeout(() => setSavedId(null), 2000);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-sm text-graphite-800/60">Carregando...</p>;

  return (
    <div className="space-y-10">
      {GROUPS.map((g) => {
        const list = products.filter((p) => p.type === g.type);
        if (list.length === 0) return null;
        return (
          <section key={g.type} className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-graphite-950">{g.title}</h2>
              {g.help && <p className="text-xs text-graphite-800/60">{g.help}</p>}
            </div>
            {list.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onChange={(patch) => update(p.id, patch)}
                onSave={() => save(p)}
                saving={savingId === p.id}
                saved={savedId === p.id}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function ProductCard({
  p,
  onChange,
  onSave,
  saving,
  saved,
}: {
  p: Product;
  onChange: (patch: Partial<Product>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOffer = p.type === "UPSELL" || p.type === "DOWNSELL";
  const isBump = p.type === "ORDER_BUMP" || p.type === "COMPLEMENTARY";

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange({ images: [...p.images, data.url] });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Falha no envio.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addLink() {
    const url = link.trim();
    if (!/^https?:\/\//.test(url)) return setError("Cole um link completo (https://…).");
    setError(null);
    onChange({ images: [...p.images, url] });
    setLink("");
  }

  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Fotos */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-graphite-800/50">Fotos (a 1ª é a principal)</p>
          <div className="flex flex-wrap gap-2">
            {p.images.map((src, i) => (
              <div key={src + i} className="group relative h-20 w-20 overflow-hidden rounded-lg bg-cream-100 ring-1 ring-graphite-950/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-0.5 opacity-0 transition group-hover:opacity-100">
                  {i > 0 ? (
                    <button type="button" title="Tornar principal" onClick={() => onChange({ images: [src, ...p.images.filter((_, j) => j !== i)] })} className="text-white">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" title="Remover" onClick={() => onChange({ images: p.images.filter((_, j) => j !== i) })} className="text-white">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-graphite-900/25 text-[10px] text-graphite-800/60 hover:bg-cream-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando…" : "Enviar"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadFile} />
          </div>
          <div className="mt-2 flex gap-2">
            <input className={field} placeholder="ou cole o link de uma imagem" value={link} onChange={(e) => setLink(e.target.value)} />
            <button type="button" onClick={addLink} className="btn-secondary px-3 py-1.5 text-xs">Adicionar</button>
          </div>
          {error && <p className="mt-1 text-xs font-semibold text-clay-700">{error}</p>}
        </div>

        {/* Dados */}
        <div className="space-y-3">
          {p.type === "MAIN" ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <label className="block text-xs text-graphite-800/70">
                Tamanho (vale para o site inteiro: seletor, checkout, pedidos, perguntas e upgrade)
                <input
                  className={`${field} mt-1 font-semibold`}
                  placeholder="Ex.: 1,80 m"
                  value={p.shortPitch ?? ""}
                  onChange={(e) => onChange({ shortPitch: e.target.value, name: `Árvore de Natal Montada ${e.target.value.trim()}` })}
                />
                <span className="mt-1 block text-[11px] text-graphite-800/50">Nome exibido: {p.name}</span>
              </label>
              <OrderInput value={p.sortOrder} onChange={(v) => onChange({ sortOrder: v })} label="Ordem (1 = menor)" />
            </div>
          ) : (
            <input className={`${field} font-semibold`} value={p.name} onChange={(e) => onChange({ name: e.target.value })} />
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Money label="Preço" cents={p.priceCents} onChange={(v) => onChange({ priceCents: v ?? 0 })} />
            <Money label="Preço antigo (opcional)" cents={p.compareAtCents} onChange={(v) => onChange({ compareAtCents: v })} />
            <Check label="Ativo" checked={p.active} onChange={(v) => onChange({ active: v })} />
            <Check label="Destaque" checked={p.featured} onChange={(v) => onChange({ featured: v })} />
          </div>

          {isBump && (
            <div className="grid gap-3 rounded-lg bg-clay-500/5 p-3 sm:grid-cols-3">
              <Check label="Mostrar no checkout" checked={p.orderBumpEnabled} onChange={(v) => onChange({ orderBumpEnabled: v })} />
              <Money label="Preço no checkout" cents={p.orderBumpPriceCents} onChange={(v) => onChange({ orderBumpPriceCents: v })} />
              <input className={`${field} sm:col-span-3`} placeholder="Texto do order bump" value={p.orderBumpHeadline ?? ""} onChange={(e) => onChange({ orderBumpHeadline: e.target.value })} />
            </div>
          )}

          {isOffer && (
            <div className="grid gap-3 rounded-lg bg-clay-500/5 p-3 sm:grid-cols-2">
              <Check label={p.type === "UPSELL" ? "Upsell ativo" : "Downsell ativo"} checked={p.upsellEnabled} onChange={(v) => onChange({ upsellEnabled: v })} />
              <Money label="Preço da oferta" cents={p.upsellPriceCents} onChange={(v) => onChange({ upsellPriceCents: v })} />
              <OrderInput value={p.sortOrder} onChange={(v) => onChange({ sortOrder: v })} label="Ordem de exibição (1 = primeiro)" />
              <textarea className={`${field} sm:col-span-2`} rows={2} placeholder="Título da oferta" value={p.upsellHeadline ?? ""} onChange={(e) => onChange({ upsellHeadline: e.target.value })} />
              <p className="text-[11px] text-graphite-800/50 sm:col-span-2">
                Dica: no nome e no título, {"{maior}"} vira o maior tamanho e {"{atual}"} o tamanho que o cliente comprou.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-graphite-800/50">
              {formatBRL(p.priceCents)}
              {p.compareAtCents ? ` (de ${formatBRL(p.compareAtCents)})` : ""}
            </p>
            <button onClick={onSave} disabled={saving} className="btn-primary px-5 py-2 text-xs">
              {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Money({ label, cents, onChange }: { label: string; cents: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-graphite-800/50">{label}</span>
      <div className="flex items-center rounded-lg border border-graphite-900/15 px-2.5">
        <span className="text-xs text-graphite-800/50">R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={cents == null ? "" : (cents / 100).toFixed(2)}
          onChange={(e) => {
            const v = Math.round(Number(e.target.value) * 100);
            onChange(e.target.value === "" || !(v > 0) ? null : v);
          }}
          className="w-full bg-transparent px-1.5 py-1.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2 text-xs text-graphite-800/80">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function OrderInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-graphite-800/50">{label}</span>
      <input
        type="number"
        min={1}
        value={value + 1}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) - 1))}
        className="w-full rounded-lg border border-graphite-900/15 px-3 py-1.5 text-sm"
      />
    </label>
  );
}
