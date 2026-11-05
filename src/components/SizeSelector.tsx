"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import ProductImage from "@/components/ProductImage";

export type SizeOption = {
  slug: string;
  label: string; // ex: "1,80 m"
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  image: string | null;
  featured: boolean;
};

export default function SizeSelector({ sizes, defaultSlug }: { sizes: SizeOption[]; defaultSlug: string }) {
  const [slug, setSlug] = useState(defaultSlug);
  const selected = sizes.find((s) => s.slug === slug) ?? sizes[0];

  return (
    <div id="tamanhos" className="scroll-mt-24">
      <div className="lg:hidden">
        <ProductImage src={selected.image} alt={selected.name} priority />
      </div>

      <p className="mt-6 text-sm font-bold text-white lg:mt-0">Escolha o tamanho:</p>
      <div className="mt-3 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Tamanho da árvore">
        {sizes.map((s) => {
          const active = s.slug === selected.slug;
          return (
            <button
              key={s.slug}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSlug(s.slug)}
              className={`relative rounded-xl2 border-2 px-2 py-3 text-center transition-colors ${
                active ? "border-sage-600 bg-sage-50" : "border-graphite-900/10 bg-white hover:border-sage-400"
              }`}
            >
              {s.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sage-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Mais escolhida
                </span>
              )}
              <span className="block text-lg font-extrabold text-graphite-950">{s.label}</span>
              <span className="mt-0.5 block text-sm font-semibold text-graphite-700">{formatBRL(s.priceCents)}</span>
              {active && <Check className="absolute right-1.5 top-1.5 h-4 w-4 text-sage-600" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        {selected.compareAtCents && selected.compareAtCents > selected.priceCents && (
          <span className="text-base text-white/50 line-through">{formatBRL(selected.compareAtCents)}</span>
        )}
        <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {formatBRL(selected.priceCents)}
        </span>
      </div>
      <p className="mt-1 text-sm text-white/80">
        Árvore de {selected.label} já montada, com pisca-pisca e enfeites · à vista no PIX · frete grátis
      </p>

      <Link href={`/checkout?tamanho=${selected.slug}`} className="btn-green mt-5 w-full text-base sm:w-auto sm:px-12">
        QUERO MINHA ÁRVORE DE {selected.label}
      </Link>
    </div>
  );
}
