import Link from "next/link";
import Image from "next/image";

export default function SiteHeader({ storeName, shippingDays, deadline }: { storeName: string; shippingDays?: string; deadline?: string }) {
  return (
    <>
      <div className="bg-clay-600 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        Frete grátis para todo o Brasil{shippingDays ? ` · Entrega em ${shippingDays} dias úteis` : ""}
        {deadline ? ` · Pedidos até ${deadline} chegam antes do Natal` : ""}
      </div>
      <header className="sticky top-0 z-30 border-b border-graphite-900/[0.06] bg-cream-50/90 backdrop-blur">
        <div className="container-app flex h-[68px] items-center justify-between">
          <Link href="/" className="flex items-center" aria-label={storeName}>
            <Image src="/images/logo.png" alt={storeName} width={900} height={292} priority className="h-11 w-auto sm:h-12" />
          </Link>
          <Link href="/#tamanhos" className="btn-primary px-5 py-2.5 text-xs">
            Comprar
          </Link>
        </div>
      </header>
    </>
  );
}
