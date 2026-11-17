"use client";

/**
 * Prova social em cards 9:16 (formato stories). Espaços RESERVADOS: troque as
 * fotos e os textos pelos depoimentos REAIS dos seus clientes antes de publicar.
 *
 * Como trocar:
 *  1. Suba as fotos/prints em /public/images/atacado/  (ex.: prova-1.jpg ...)
 *     — na proporção 9:16 (ex.: 1080x1920).
 *  2. Edite a lista PROOFS abaixo: img, title, desc, name, city.
 *  3. Pode usar vídeo trocando mediaType para "video" e apontando img pro .mp4.
 */
import { useState } from "react";
import { Star, ImageIcon, MapPin } from "lucide-react";

type Proof = {
  img: string;
  mediaType?: "image" | "video";
  title: string;
  desc: string;
  name: string;
  city: string;
};

const PROOFS: Proof[] = [
  {
    img: "/images/atacado/prova-mercado.png",
    title: "Reposição garantida pro mercado",
    desc: "Panetone caseiro e Bauducco em volume, com preço que fecha a conta no fim do ano.",
    name: "Mercado parceiro",
    city: "Revenda",
  },
  {
    img: "/images/atacado/prova-doacao.png",
    title: "Nossa ação social foi um sucesso",
    desc: "Compramos pra doação e as famílias amaram. Já quero repetir ano que vem.",
    name: "Instituição parceira",
    city: "Ação social",
  },
  {
    img: "/images/atacado/prova-loja.png",
    title: "Qualidade de verdade, preço justo",
    desc: "Revendi tudo rapidinho. Panetone caseiro macio e bem recheado.",
    name: "Loja parceira",
    city: "Revenda",
  },
  {
    img: "/images/atacado/prova-padaria.png",
    title: "Atendimento humano do início ao fim",
    desc: "Tirei todas as dúvidas no WhatsApp e fechei sem dor de cabeça.",
    name: "Padaria parceira",
    city: "Brindes",
  },
  {
    img: "/images/atacado/prova-estoque.png",
    title: "Pedido grande, conferido e no prazo",
    desc: "Caixas certinhas, entrega combinada e tudo rastreável do começo ao fim.",
    name: "Cliente atacado",
    city: "Grande volume",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow" />
      ))}
    </div>
  );
}

function ProofCard({ p }: { p: Proof }) {
  const [broken, setBroken] = useState(false);
  return (
    <figure className="w-[70%] shrink-0 snap-center sm:w-[260px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl2 bg-graphite-900 shadow-lift">
        {!broken ? (
          p.mediaType === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={p.img} className="h-full w-full object-cover" muted loop playsInline autoPlay onError={() => setBroken(true)} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover" onError={() => setBroken(true)} />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-graphite-800 to-graphite-950 text-center text-cream-200">
            <ImageIcon className="h-8 w-8 opacity-70" />
            <p className="px-4 text-xs">
              Espaço reservado 9:16
              <br />
              <span className="opacity-70">troque pela foto/print real</span>
            </p>
          </div>
        )}

        {/* 5 estrelas no topo */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 pb-8">
          <Stars />
          <span className="text-xs font-semibold text-white/90">5,0</span>
        </div>

        {/* Título + descrição sobrepostos embaixo */}
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 pt-12 text-white">
          <p className="text-sm font-extrabold leading-snug">{p.title}</p>
          <p className="mt-1 text-xs leading-snug text-white/85">{p.desc}</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-white/70">
            <MapPin className="h-3 w-3" />
            {p.name} · {p.city}
          </p>
        </figcaption>
      </div>
    </figure>
  );
}

export default function SocialProofStrip() {
  return (
    <section data-sec="Prova social" className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-3">Quem já pediu, aprovou</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Empresas e instituições que confiaram na gente
          </h2>
          <p className="mt-3 text-graphite-600">
            Atendimento humano, entrega no prazo e panetone que volta a ser pedido no ano seguinte.
          </p>
        </div>

        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:justify-center sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PROOFS.map((p, i) => (
            <ProofCard key={i} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
