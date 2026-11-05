import Link from "next/link";
import { formatBRL } from "@/lib/pricing";

export default function StickyCta({ fromPriceCents }: { fromPriceCents: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite-900/10 bg-cream-50/95 p-3 shadow-lift backdrop-blur">
      <div className="container-app flex items-center justify-between gap-3">
        <p className="text-xs leading-tight text-graphite-700 sm:text-sm">
          A partir de <strong className="block text-base text-graphite-950 sm:inline">{formatBRL(fromPriceCents)}</strong>
        </p>
        <Link href="/#tamanhos" className="btn-primary flex-1 sm:flex-none sm:px-10">
          ESCOLHER TAMANHO
        </Link>
      </div>
    </div>
  );
}
