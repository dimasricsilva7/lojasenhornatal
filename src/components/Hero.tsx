import { Star } from "lucide-react";
import TrustBar from "@/components/TrustBar";
import SizeSelector, { type SizeOption } from "@/components/SizeSelector";
import ProductImage from "@/components/ProductImage";

export default function Hero({
  sizes,
  defaultSlug,
  reviewStats,
}: {
  sizes: SizeOption[];
  defaultSlug: string;
  reviewStats: { count: number; avg: number };
}) {
  const heroImage = sizes.find((s) => s.slug === defaultSlug)?.image ?? sizes.find((s) => s.image)?.image ?? null;

  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="container-app grid gap-8 py-6 sm:py-10 lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-14">
        <div className="hidden lg:block lg:sticky lg:top-24">
          <ProductImage src={heroImage} alt="Árvore de Natal montada, enfeitada e com pisca-pisca aceso" priority />
        </div>

        <div className="animate-fadeUp">
          <span className="inline-flex items-center rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-700">
            Árvore de Natal montada · Verde tradicional
          </span>

          <h1 className="mt-4 text-[1.9rem] font-extrabold leading-[1.15] tracking-tight text-graphite-950 sm:text-4xl lg:text-[2.6rem]">
            Sua árvore de Natal pronta em minutos: já vem montada, com pisca-pisca e enfeites.
          </h1>
          <p className="mt-4 max-w-lg text-base text-graphite-700 sm:text-lg">
            Nada de passar a tarde abrindo galho, desembaraçando fio e correndo atrás de enfeite. Tira da caixa, abre os
            galhos e liga na tomada.
          </p>

          {reviewStats.count > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-graphite-700">
              <span className="flex text-clay-600">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewStats.avg) ? "fill-current" : "fill-none"}`} strokeWidth={1.5} />
                ))}
              </span>
              <span className="font-bold text-graphite-950">{reviewStats.avg.toFixed(1).replace(".", ",")}/5</span>
              <span className="text-graphite-700/70">· {reviewStats.count} avaliações de clientes</span>
            </div>
          )}

          <div className="mt-6">
            <SizeSelector sizes={sizes} defaultSlug={defaultSlug} />
          </div>

          <TrustBar className="mt-6" variant="compact" />
        </div>
      </div>
    </section>
  );
}
