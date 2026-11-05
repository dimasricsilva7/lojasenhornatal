import Link from "next/link";
import { TreePine } from "lucide-react";

export default function SiteHeader({ storeName, shippingDays, deadline }: { storeName: string; shippingDays?: string; deadline?: string }) {
  return (
    <>
      <div className="bg-clay-600 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        Frete grátis para todo o Brasil{shippingDays ? ` · Entrega em ${shippingDays} dias úteis` : ""}
        {deadline ? ` · Pedidos até ${deadline} chegam antes do Natal` : ""}
      </div>
      <header className="sticky top-0 z-30 border-b border-graphite-900/[0.06] bg-cream-50/90 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-600 text-cream-50">
              <TreePine className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-base font-extrabold tracking-tight text-graphite-950">{storeName}</span>
          </Link>
          <Link href="/#tamanhos" className="btn-primary px-5 py-2.5 text-xs">
            Comprar
          </Link>
        </div>
      </header>
    </>
  );
}
