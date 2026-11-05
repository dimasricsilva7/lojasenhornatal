import Link from "next/link";
import TrustBar from "@/components/TrustBar";
import { formatBRL } from "@/lib/pricing";

export default function FinalCta({ fromPriceCents, deadline }: { fromPriceCents: number; deadline?: string }) {
  return (
    <section className="section bg-sage-600 text-white">
      <div className="container-app max-w-xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Este ano, a árvore chega pronta e você só aproveita.
        </h2>
        <p className="mt-4 text-white/85">
          A partir de <strong className="text-white">{formatBRL(fromPriceCents)}</strong>, com pisca-pisca, enfeites e frete grátis.
          {deadline ? ` Pedidos até ${deadline} chegam antes do Natal.` : ""}
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/#produtos" className="btn-primary">
            ESCOLHER MEU TAMANHO
          </Link>
        </div>
        <TrustBar className="mt-8 justify-center text-white/85 [&_svg]:text-white" />
      </div>
    </section>
  );
}
