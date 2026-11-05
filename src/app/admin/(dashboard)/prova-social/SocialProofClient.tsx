"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";

type Item = {
  id: string;
  mediaType: "image" | "video";
  url: string;
  caption: string | null;
  name: string | null;
  city: string | null;
  active: boolean;
  sortOrder: number;
};

const input = "w-full rounded-lg border border-graphite-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600";

export default function SocialProofClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ url: "", mediaType: "auto", name: "", city: "", caption: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/social-proof", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/admin/social-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: form.url,
        mediaType: form.mediaType === "auto" ? undefined : form.mediaType,
        name: form.name,
        city: form.city,
        caption: form.caption,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Link inválido. Cole o endereço completo (https://…) do vídeo ou da imagem.");
      return;
    }
    setForm({ url: "", mediaType: "auto", name: "", city: "", caption: "" });
    load();
  }

  async function patch(id: string, data: Partial<Item>) {
    await fetch(`/api/admin/social-proof/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover este item da prova social?")) return;
    await fetch(`/api/admin/social-proof/${id}`, { method: "DELETE" });
    load();
  }

  async function move(index: number, dir: -1 | 1) {
    const a = items[index];
    const b = items[index + dir];
    if (!a || !b) return;
    await Promise.all([
      fetch(`/api/admin/social-proof/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      fetch(`/api/admin/social-proof/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ]);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-graphite-950">Prova social</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite-800/70">
          Vídeos e fotos em pé (9:16) que aparecem na seção &quot;Quem já montou a sua&quot; da página. Use somente conteúdo real de
          clientes, com autorização de uso. A seção só aparece no site quando houver pelo menos 1 item visível.
        </p>
      </div>

      <form onSubmit={add} className="card-surface grid gap-3 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold text-graphite-950">
          Link do vídeo (MP4/WEBM) ou da imagem (JPG/PNG/WEBP/GIF)
          <input className={`${input} mt-1`} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" required />
        </label>
        <label className="text-sm font-semibold text-graphite-950">
          Tipo
          <select className={`${input} mt-1`} value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })}>
            <option value="auto">Detectar pelo link</option>
            <option value="video">Vídeo</option>
            <option value="image">Imagem</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-graphite-950">
          Nome do cliente (opcional)
          <input className={`${input} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Ana" />
        </label>
        <label className="text-sm font-semibold text-graphite-950">
          Cidade/UF (opcional)
          <input className={`${input} mt-1`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex.: Campinas/SP" />
        </label>
        <label className="text-sm font-semibold text-graphite-950">
          Legenda (opcional)
          <input className={`${input} mt-1`} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Ex.: Montei em 5 minutos" />
        </label>
        {error && <p className="sm:col-span-2 text-sm font-semibold text-clay-700">{error}</p>}
        <div className="sm:col-span-2">
          <button className="btn-primary px-6 py-3" disabled={saving}>{saving ? "Adicionando…" : "Adicionar"}</button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-graphite-800/60">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-graphite-800/60">Nenhum item ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((it, i) => (
            <div key={it.id} className={`card-surface overflow-hidden ${it.active ? "" : "opacity-50"}`}>
              <div className="relative aspect-[9/16] bg-graphite-950">
                {it.mediaType === "video" ? (
                  <video src={it.url} className="h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="space-y-1 p-3 text-xs">
                <p className="font-bold text-graphite-950">{[it.name, it.city].filter(Boolean).join(" · ") || "Sem nome"}</p>
                {it.caption && <p className="text-graphite-800/70">{it.caption}</p>}
                <div className="flex gap-1 pt-1">
                  <button type="button" title="Subir" onClick={() => move(i, -1)} className="rounded p-1.5 hover:bg-cream-100"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" title="Descer" onClick={() => move(i, 1)} className="rounded p-1.5 hover:bg-cream-100"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" title={it.active ? "Ocultar" : "Mostrar"} onClick={() => patch(it.id, { active: !it.active })} className="rounded p-1.5 hover:bg-cream-100">
                    {it.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button type="button" title="Remover" onClick={() => remove(it.id)} className="ml-auto rounded p-1.5 text-clay-700 hover:bg-clay-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
