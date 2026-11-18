"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, MapPin } from "lucide-react";

export type ProofItem = {
  id: string;
  mediaType: string;
  url: string;
  caption: string | null;
  name: string | null;
  city: string | null;
};

/** Vídeo 9:16 que só toca quando está na tela (economiza dados no celular). */
function ProofVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <video
        ref={ref}
        // #t=0.1 força o navegador a mostrar o 1º frame como poster (senão fica tela preta no iOS).
        src={src.includes("#") ? src : `${src}#t=0.1`}
        className="h-full w-full object-cover"
        muted={muted}
        loop
        autoPlay
        playsInline
        preload="metadata"
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Ativar som" : "Desativar som"}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </>
  );
}

function ProofCard({ it, ariaHidden }: { it: ProofItem; ariaHidden?: boolean }) {
  return (
    <figure className="w-[62%] shrink-0 sm:w-[240px]" aria-hidden={ariaHidden}>
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl2 bg-graphite-950 shadow-card">
        {it.mediaType === "video" ? (
          <ProofVideo src={it.url} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.url} alt={it.caption ?? "Foto de cliente com a árvore montada"} loading="lazy" className="h-full w-full object-cover" />
        )}
        {(it.name || it.city || it.caption) && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
            {it.caption && <p className="text-sm font-semibold leading-snug">{it.caption}</p>}
            {(it.name || it.city) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                {it.city && <MapPin className="h-3 w-3" />}
                {[it.name, it.city].filter(Boolean).join(" · ")}
              </p>
            )}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

export default function SocialProof({ items }: { items: ProofItem[] }) {
  if (items.length === 0) return null;

  return (
    <section data-sec="Prova social" className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Quem já montou a sua</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Veja a árvore na casa de quem comprou
          </h2>
        </div>

        {/* Marquee: as mídias passam continuamente para a esquerda; pausa ao passar o mouse.
            Em telas com poucas mídias ou com "reduzir movimento", vira rolagem manual. */}
        <div className="group mt-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
          <div
            className="flex w-max gap-3 pb-1 motion-safe:animate-marquee group-hover:[animation-play-state:paused]"
            style={{ animationDuration: `${Math.max(items.length * 7, 24)}s` }}
          >
            {[...items, ...items].map((it, i) => (
              <ProofCard key={`${it.id}-${i}`} it={it} ariaHidden={i >= items.length} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
