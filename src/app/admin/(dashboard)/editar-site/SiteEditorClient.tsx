"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";

type Field = { key: string; label: string; textarea?: boolean; hint?: string; rows?: number };

const GROUPS: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Topo (Hero)",
    fields: [
      { key: "hero_badge", label: "Selo acima do título" },
      { key: "hero_title", label: "Título principal", textarea: true },
      { key: "hero_subtitle", label: "Subtítulo", textarea: true },
    ],
  },
  {
    title: "Seção “Todo ano a mesma coisa”",
    fields: [
      { key: "problem_eyebrow", label: "Rótulo (letrinha em cima)" },
      { key: "problem_title", label: "Título", textarea: true },
      { key: "problem_pains", label: "Problemas (um por linha, ícone fixo)", textarea: true, rows: 5 },
      { key: "problem_closing", label: "Frase de fechamento", textarea: true },
    ],
  },
  {
    title: "Seção “Como montar”",
    hint: "Um passo por linha, no formato: Título | Descrição",
    fields: [
      { key: "howto_eyebrow", label: "Rótulo" },
      { key: "howto_title", label: "Título" },
      { key: "howto_steps", label: "Passos (Título | Descrição por linha)", textarea: true, rows: 5 },
    ],
  },
  {
    title: "Seção “O que vem na caixa”",
    fields: [
      { key: "box_eyebrow", label: "Rótulo" },
      { key: "box_title", label: "Título", textarea: true },
      { key: "box_subtitle", label: "Subtítulo", textarea: true },
      { key: "box_footnote", label: "Observação (rodapé da seção)", textarea: true },
    ],
  },
  {
    title: "Tabela “Árvore comum vs. Senhor Natal”",
    hint: "Uma linha por item, no formato: Rótulo | Árvore comum | Senhor Natal",
    fields: [
      { key: "comparison_eyebrow", label: "Rótulo" },
      { key: "comparison_title", label: "Título", textarea: true },
      { key: "comparison_rows", label: "Linhas (Rótulo | Comum | Senhor Natal)", textarea: true, rows: 6 },
    ],
  },
  {
    title: "Seção “Para quem é”",
    fields: [
      { key: "forwhom_eyebrow", label: "Rótulo" },
      { key: "forwhom_title", label: "Título", textarea: true },
      { key: "forwhom_items", label: "Itens (um por linha)", textarea: true, rows: 5 },
    ],
  },
  {
    title: "Seção de produtos (cards)",
    fields: [
      { key: "products_eyebrow", label: "Rótulo" },
      { key: "products_title", label: "Título", textarea: true },
      { key: "products_subtitle", label: "Subtítulo", textarea: true },
    ],
  },
  {
    title: "Perguntas frequentes",
    hint: "As perguntas e respostas são automáticas (prazo, tamanhos etc). Aqui você edita só o cabeçalho.",
    fields: [
      { key: "faq_eyebrow", label: "Rótulo" },
      { key: "faq_title", label: "Título" },
    ],
  },
  {
    title: "Chamada final",
    fields: [
      { key: "finalcta_title", label: "Título", textarea: true },
      { key: "finalcta_cta", label: "Texto do botão" },
    ],
  },
];

export default function SiteEditorClient() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setSettings).finally(() => setLoading(false));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError(null);
    setImgUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "falha");
      setSettings((s) => ({ ...s, hero_image_url: data.url }));
    } catch (err) {
      setImgError(err instanceof Error && err.message !== "falha" ? err.message : "Falha ao enviar a imagem. Tente novamente (ou cole um link abaixo).");
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-graphite-800/60">Carregando...</p>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <p className="text-sm text-graphite-800/70">
        Edite os textos e a imagem do topo do site. Deixe um campo em branco para voltar ao texto padrão.
        Depois de editar, clique em <strong>Salvar</strong> no fim da página.
      </p>

      {/* Imagem da hero */}
      <div className="card-surface space-y-4 p-6">
        <div>
          <p className="text-sm font-bold text-graphite-950">Imagem do topo (Hero)</p>
          <p className="mt-1 text-xs text-graphite-800/60">
            Aparece ao lado do título, no computador. Vazio = usa a foto do produto cadastrada em Produtos. JPG, PNG, WEBP ou GIF.
          </p>
        </div>

        {settings.hero_image_url && (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.hero_image_url} alt="Prévia da imagem do topo" className="h-40 w-auto rounded-lg bg-cream-100 object-contain ring-1 ring-graphite-950/10" />
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, hero_image_url: "" }))}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          </div>
        )}

        <div>
          <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" id="hero-image-input" />
          <label
            htmlFor="hero-image-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-graphite-900/15 px-4 py-2.5 text-sm font-medium text-graphite-800 hover:bg-cream-50"
          >
            {imgUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {imgUploading ? "Enviando..." : settings.hero_image_url ? "Trocar imagem" : "Enviar imagem"}
          </label>
          {imgError && <p className="mt-2 text-xs text-red-600">{imgError}</p>}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-graphite-800/70">Ou cole o link de uma imagem</span>
          <input
            value={settings.hero_image_url ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, hero_image_url: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
          />
        </label>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="card-surface space-y-4 p-6">
          <div>
            <p className="text-sm font-bold text-graphite-950">{group.title}</p>
            {group.hint && <p className="mt-1 text-xs text-graphite-800/55">{group.hint}</p>}
          </div>
          {group.fields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">{field.label}</span>
              {field.textarea ? (
                <textarea
                  value={settings[field.key] ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                  rows={field.rows ?? 3}
                  className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
                />
              ) : (
                <input
                  value={settings[field.key] ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
                />
              )}
              {field.hint && <span className="mt-1 block text-xs text-graphite-800/50">{field.hint}</span>}
            </label>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="text-sm text-sage-700">Salvo! As mudanças já estão no ar.</span>}
      </div>
    </form>
  );
}
