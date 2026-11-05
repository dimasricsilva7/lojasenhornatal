import Link from "next/link";
import TrustBar from "@/components/TrustBar";
import { formatBRL } from "@/lib/pricing";

export default function FinalCta({ fromPriceCents, deadline }: { fromPriceCents: number; deadline?: string }) {
  return (
    <section className="section bg-graphite-950 text-cream-50">
      <div className="container-app max-w-xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Este ano, a árvore chega pronta e você só aproveita.
        </h2>
        <p className="mt-4 text-cream-50/80">
          A partir de <strong className="text-cream-50">{formatBRL(fromPriceCents)}</strong>, com pisca-pisca, enfeites e frete grátis.
          {deadline ? ` Pedidos até ${deadline} chegam antes do Natal.` : ""}
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/#tamanhos" className="btn-primary">
            ESCOLHER MEU TAMANHO
          </Link>
        </div>
        <TrustBar className="mt-8 justify-center text-cream-50/85 [&_svg]:text-clay-400" />
      </div>
    </section>
  );
}
