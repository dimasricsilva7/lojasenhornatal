import { Check, X, Gift } from "lucide-react";
import { settingLines, settingRows, type SettingsMap } from "@/lib/settings";


export const DEFAULT_BOX_ITEMS = [
  "Árvore verde tradicional, já decorada (abre como sanfona)",
  "Mastro central de encaixe",
  "Pisca-pisca já instalado nos galhos",
  "Papais Noéis de pendurar",
  "Caixinhas de presente penduradas",
  "Pinhas penduradas",
  "Bolas vermelhas e douradas",
  "Laços e fitas vermelhas e douradas",
  "Flores natalinas douradas",
].join("\n");

export function WhatsInTheBox({ items, imageUrl, settings }: { items: string; imageUrl?: string | null; settings: SettingsMap }) {
  const list = (items || DEFAULT_BOX_ITEMS).split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <section className="section bg-clay-600">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">{settings.box_eyebrow}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {settings.box_title}
          </h2>
          <p className="mt-3 text-white/90">{settings.box_subtitle}</p>
        </div>
        <div className={`mt-10 grid items-center gap-8 ${imageUrl ? "lg:grid-cols-2" : ""}`}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Itens que vêm na caixa da árvore" className="mx-auto w-full max-w-md rounded-xl2 shadow-card" />
          )}
          <ul className={`grid gap-3 ${imageUrl ? "" : "mx-auto max-w-3xl sm:grid-cols-2"}`}>
            {list.map((t) => (
              <li key={t} className="card-surface flex items-center gap-3 p-4 text-base font-semibold text-graphite-900">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <Gift className="h-4 w-4" strokeWidth={2} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-xs text-white/70">
          {settings.box_footnote}
        </p>
      </div>
    </section>
  );
}

export function Comparison({ settings }: { settings: SettingsMap }) {
  const rows = settingRows(settings.comparison_rows);
  return (
    <section className="section bg-white">
      <div className="container-app max-w-3xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">{settings.comparison_eyebrow}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            {settings.comparison_title}
          </h2>
        </div>
        <div className="mt-10 overflow-hidden rounded-xl2 ring-1 ring-graphite-950/[0.08]">
          <div className="grid grid-cols-[1fr_1.3fr_1.3fr] bg-cream-100 text-xs font-bold uppercase tracking-wide text-graphite-700 sm:text-sm">
            <div className="p-3 sm:p-4" />
            <div className="p-3 sm:p-4">Árvore comum</div>
            <div className="bg-sage-600 p-3 text-cream-50 sm:p-4">Senhor Natal</div>
          </div>
          {rows.map(([label, common, ours]) => (
            <div key={label} className="grid grid-cols-[1fr_1.3fr_1.3fr] border-t border-graphite-950/[0.06] text-sm">
              <div className="p-3 font-bold text-graphite-950 sm:p-4">{label}</div>
              <div className="flex gap-2 p-3 text-graphite-700 sm:p-4">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" strokeWidth={2.5} />
                {common}
              </div>
              <div className="flex gap-2 bg-sage-50 p-3 font-semibold text-graphite-950 sm:p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" strokeWidth={2.5} />
                {ours}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Benefits({ settings }: { settings: SettingsMap }) {
  const forWhom = settingLines(settings.forwhom_items);
  return (
    <section className="section bg-sage-600">
      <div className="container-app max-w-3xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">{settings.forwhom_eyebrow}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{settings.forwhom_title}</h2>
        </div>
        <ul className="mt-8 space-y-3">
          {forWhom.map((t) => (
            <li key={t} className="card-surface flex gap-3 p-4 text-base text-graphite-800">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
