import { Clock, Unplug, ShoppingBag, TreePine, PackageOpen, Move, Plug } from "lucide-react";
import { settingLines, settingRows, type SettingsMap } from "@/lib/settings";

const PAIN_ICONS = [Clock, Unplug, ShoppingBag, TreePine];

export function ProblemSection({ settings }: { settings: SettingsMap }) {
  const pains = settingLines(settings.problem_pains);
  return (
    <section data-sec="Problema" className="section bg-sage-600">
      <div className="container-app max-w-3xl">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/80">{settings.problem_eyebrow}</p>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {settings.problem_title}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {pains.map((text, i) => {
            const Icon = PAIN_ICONS[i] ?? TreePine;
            return (
              <li key={text} className="flex gap-4 rounded-xl2 bg-white/10 p-5 ring-1 ring-white/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="text-base text-white/90">{text}</p>
              </li>
            );
          })}
        </ul>
        <p className="mx-auto mt-10 max-w-xl text-center text-lg font-semibold text-white">
          {settings.problem_closing}
        </p>
      </div>
    </section>
  );
}

const STEP_ICONS = [PackageOpen, Move, Plug];

function HowToMedia({ url }: { url: string }) {
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(url.split("?")[0]);
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-xl2 bg-graphite-950 shadow-lift ring-1 ring-white/10">
      {isVideo ? (
        <video src={url} className="aspect-[9/16] h-auto w-full object-cover" muted loop playsInline autoPlay preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Montagem da árvore passo a passo" className="aspect-[9/16] h-auto w-full object-cover" />
      )}
    </div>
  );
}

export function HowItWorksSection({ mediaUrl, settings }: { mediaUrl?: string; settings: SettingsMap }) {
  const steps = settingRows(settings.howto_steps);
  return (
    <section id="como-funciona" data-sec="Vídeo / Como montar" className="section scroll-mt-16 bg-sage-700 text-cream-50">
      <div className={`container-app grid items-center gap-10 ${mediaUrl ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        <div>
          <div className={mediaUrl ? "max-w-xl" : "mx-auto max-w-xl text-center"}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-sage-200">{settings.howto_eyebrow}</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{settings.howto_title}</h2>
          </div>
          <ol className={`mt-8 grid gap-4 ${mediaUrl ? "" : "sm:grid-cols-3"}`}>
            {steps.map(([title, desc], i) => {
              const Icon = STEP_ICONS[i] ?? Plug;
              return (
                <li key={title} className="rounded-xl2 bg-white/[0.07] p-5 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-500 text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-sage-200" strokeWidth={1.75} />
                    <p className="text-lg font-bold">{title}</p>
                  </div>
                  {desc && <p className="mt-2 text-sm text-cream-50/80">{desc}</p>}
                </li>
              );
            })}
          </ol>
        </div>
        {mediaUrl && <HowToMedia url={mediaUrl} />}
      </div>
    </section>
  );
}
