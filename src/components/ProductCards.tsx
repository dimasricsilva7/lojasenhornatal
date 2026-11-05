import Link from "next/link";
import Image from "next/image";
import { TreePine } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import type { SettingsMap } from "@/lib/settings";

export type ProductCard = {
  slug: string;
  name: string;
  label: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  image: string | null;
  featured: boolean;
};

export default function ProductCards({ products, settings }: { products: ProductCard[]; settings: SettingsMap }) {
  return (
    <section id="produtos" className="section scroll-mt-20 bg-sage-600">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">{settings.products_eyebrow}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {settings.products_title}
          </h2>
          <p className="mt-3 text-white/90">
            {settings.products_subtitle}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.slug} className="card-surface flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
              <div className="relative aspect-square bg-cream-100">
                {p.featured && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-clay-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Mais escolhida
                  </span>
                )}
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 90vw, 360px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sage-50 text-sage-600">
                    <TreePine className="h-16 w-16" strokeWidth={1.25} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-700/70">Foto do produto</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-extrabold text-graphite-950">{p.name}</h3>
                {p.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-graphite-700/85">{p.description}</p>
                )}

                <div className="mt-4 flex items-baseline gap-2">
                  {p.compareAtCents && p.compareAtCents > p.priceCents && (
                    <span className="text-sm text-graphite-700/40 line-through">{formatBRL(p.compareAtCents)}</span>
                  )}
                  <span className="text-2xl font-extrabold tracking-tight text-graphite-950">{formatBRL(p.priceCents)}</span>
                </div>

                <Link href={`/checkout?tamanho=${p.slug}`} className="btn-primary mt-5 w-full">
                  COMPRAR {p.label}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
