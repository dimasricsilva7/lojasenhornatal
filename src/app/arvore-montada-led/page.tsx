import type { Metadata } from "next";
import ViewContentTracker from "@/components/ViewContentTracker";
import LedClient, { BuyButton } from "./LedClient";
import Gallery from "./Gallery";
import { MAIN, ORDER_BUMPS, UPSELLS, REVIEWS } from "@/lib/led/config";

export const dynamic = "force-dynamic";

const PRICE = MAIN.priceCents / 100;
const COMPARE = MAIN.compareAtCents / 100;
const OFF = Math.round((1 - MAIN.priceCents / MAIN.compareAtCents) * 100);
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// #t=0.1 força o 1º frame como poster (senão o vídeo fica preto no iOS).
const poster = (u: string) => (u.includes("#") ? u : `${u}#t=0.1`);
const REVIEW_COUNT_LABEL = "+5 mil"; // prova social: total exibido

export const metadata: Metadata = {
  title: "Árvore de Natal Espiral LED 1,80m Dobrável com Enfeites",
  description: "Árvore de Natal Espiral LED 1,80m com Papai Noel, sinos e bengalas. Dobrável, bivolt. Pague no PIX com entrega para todo o Brasil.",
  robots: { index: true, follow: true },
  openGraph: { title: "Árvore de Natal Espiral LED 1,80m", description: "Design espiral iluminado, enfeites inclusos.", images: [MAIN.images[0]], type: "website" },
};

const HIGHLIGHTS = [
  "Altura aproximada de 1,80 m",
  "Design espiral moderno com iluminação LED",
  "Enfeites inclusos: Papai Noel, sinos, bengalas e adornos",
  "Estrutura dobrável — fácil de montar e guardar",
  "Bivolt (110V/220V conforme o modelo)",
  "Ideal para sala, apartamento, loja ou escritório",
];

const SPECS: [string, string][] = [
  ["Produto", "Árvore de Natal Espiral LED"],
  ["Altura", "Aproximadamente 1,80 m"],
  ["Modelo", "Espiral decorativa"],
  ["Iluminação", "LED"],
  ["Estrutura", "Dobrável"],
  ["Alimentação", "110V / 220V (conforme o modelo)"],
  ["Decoração", "Enfeites natalinos variados"],
  ["Montagem", "Prática e descomplicada"],
];

export default function LedPage() {
  const videoReviews = REVIEWS.filter((r) => r.mediaType === "video");
  return (
    <main className="min-h-screen bg-cream-50 pb-28 text-graphite-900">
      <ViewContentTracker productId={MAIN.slug} productName={MAIN.name} priceCents={MAIN.priceCents} />

      <div className="mx-auto w-full max-w-xl bg-white">
        {/* GALERIA DO PRODUTO */}
        <Gallery video={MAIN.videoUrl} images={MAIN.images} off={OFF} />

        {/* INFO DO PRODUTO */}
        <section className="px-4 pt-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#c0392b]">{brl(PRICE)}</span>
            <span className="text-base text-graphite-400 line-through">{brl(COMPARE)}</span>
            <span className="rounded bg-[#c0392b]/10 px-2 py-0.5 text-xs font-bold text-[#c0392b]">-{OFF}%</span>
          </div>

          <h1 className="mt-2 text-lg font-semibold leading-snug text-graphite-950">
            Árvore de Natal Espiral LED 1,80m Dobrável com Enfeites, Papai Noel, Sinos e Bengalas Decorativas
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-graphite-500">
            <span className="text-amber-500">★★★★★</span>
            <span>5,0</span>
            <span className="text-graphite-300">·</span>
            <span>{REVIEW_COUNT_LABEL} avaliações</span>
            <span className="text-graphite-300">·</span>
            <span>Pagamento no PIX</span>
          </div>
        </section>

        {/* ENTREGA / PAGAMENTO */}
        <section className="mt-3 divide-y divide-graphite-900/5 border-y border-graphite-900/5 px-4 text-sm">
          <div className="flex items-center gap-2 py-2.5"><span>🚚</span><span className="text-graphite-700">Enviamos para <strong>todo o Brasil</strong> · código de rastreio após o pagamento</span></div>
          <div className="flex items-center gap-2 py-2.5"><span>🔒</span><span className="text-graphite-700">Pagamento via <strong>PIX</strong> com aprovação imediata</span></div>
          <div className="flex items-center gap-2 py-2.5"><span>🎁</span><span className="text-graphite-700">Enfeites decorativos <strong>inclusos</strong></span></div>
        </section>

        {/* COMPRAR (desktop/inline) */}
        <section className="px-4 py-4">
          <BuyButton className="led-btn-primary block w-full text-center text-lg">Comprar agora</BuyButton>
        </section>

        {/* DESTAQUES */}
        <section className="px-4 py-2">
          <h2 className="mb-2 text-base font-bold text-graphite-950">Destaques</h2>
          <ul className="space-y-1.5">
            {HIGHLIGHTS.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-graphite-700"><span className="text-emerald-600">✓</span>{h}</li>
            ))}
          </ul>
        </section>

        {/* AVALIAÇÕES EM VÍDEO (mídia de clientes, estilo marketplace) */}
        <section className="px-4 py-4">
          <h2 className="mb-2 text-base font-bold text-graphite-950">Mídia dos clientes</h2>
          {/* Marquee: as mídias passam continuamente para a esquerda; pausa ao passar o mouse. */}
          <div className="group -mx-4 overflow-hidden px-4 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <div
              className="flex w-max gap-2 py-1 motion-safe:animate-marquee group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${Math.max(videoReviews.length * 6, 20)}s` }}
            >
              {[...videoReviews, ...videoReviews].map((r, i) => (
                <div key={i} aria-hidden={i >= videoReviews.length} className="w-28 shrink-0 overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "9 / 16" }}>
                  <video src={poster(r.mediaUrl)} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DESCRIÇÃO */}
        <section className="border-t border-graphite-900/5 px-4 py-4">
          <h2 className="mb-2 text-base font-bold text-graphite-950">Descrição do produto</h2>
          <div className="space-y-3 text-sm leading-relaxed text-graphite-700">
            <p>A Árvore de Natal Espiral LED de 1,80m combina iluminação aconchegante, design diferenciado e enfeites natalinos que deixam qualquer ambiente muito mais especial. O formato espiral cria um efeito visual encantador, enquanto os detalhes decorativos trazem toda a magia do Natal para dentro da sua casa.</p>
            <p>Além de linda, possui estrutura dobrável, montagem prática e armazenamento facilitado para utilizar em todos os seus Natais.</p>
            <p><strong>💡 Iluminação LED encantadora</strong> — destaca o formato espiral e cria um visual acolhedor e festivo.</p>
            <p><strong>🎅 Decoração completa</strong> — enfeites inclusos (Papai Noel, bengalas, sinos dourados e adornos variados).</p>
            <p><strong>📏 1,80 m de altura</strong> — ganha destaque no ambiente sem ocupar o espaço de uma árvore volumosa. Ótima para salas, apartamentos, escritórios, lojas e recepções.</p>
            <p><strong>📦 Dobrável e fácil de guardar</strong> — a estrutura dobrável facilita o armazenamento após as festas para reutilizar no próximo Natal.</p>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">⚠️ Por ter design espiral, este modelo não apresenta o mesmo volume de uma árvore tradicional de pinheiro. Os enfeites podem apresentar pequenas variações conforme a disponibilidade.</p>
          </div>
        </section>

        {/* ESPECIFICAÇÕES */}
        <section className="border-t border-graphite-900/5 px-4 py-4">
          <h2 className="mb-2 text-base font-bold text-graphite-950">Especificações</h2>
          <div className="overflow-hidden rounded-lg border border-graphite-900/5">
            {SPECS.map(([k, v], i) => (
              <div key={i} className={`flex justify-between gap-4 px-3 py-2 text-sm ${i % 2 ? "bg-cream-50/60" : "bg-white"}`}>
                <span className="text-graphite-500">{k}</span><span className="text-right font-medium text-graphite-900">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* AVALIAÇÕES */}
        <section className="border-t border-graphite-900/5 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-graphite-950">Avaliações ({REVIEW_COUNT_LABEL})</h2>
            <span className="text-sm text-amber-500">★★★★★ <span className="text-graphite-500">5,0</span></span>
          </div>
          <div className="space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="flex gap-3 border-b border-graphite-900/5 pb-3">
                <div className="w-20 shrink-0 overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "9 / 16" }}>
                  {r.mediaType === "video"
                    ? <video src={poster(r.mediaUrl)} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
                    /* eslint-disable-next-line @next/next/no-img-element */
                    : <img src={r.mediaUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-graphite-950">{r.name}</p>
                    <span className="text-[10px] font-semibold text-emerald-700">✔ Compra verificada</span>
                  </div>
                  <p className="text-xs text-amber-500">★★★★★</p>
                  <p className="mt-1 text-sm text-graphite-700">{r.text}</p>
                  <p className="mt-1 text-[11px] text-graphite-400">{r.city}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <LedClient main={{ slug: MAIN.slug, name: MAIN.name, priceCents: MAIN.priceCents, compareAtCents: MAIN.compareAtCents }} bumps={ORDER_BUMPS} upsells={UPSELLS} />
    </main>
  );
}
