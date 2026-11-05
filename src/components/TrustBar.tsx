import { Lock, Truck, Wallet, ShieldCheck, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Lock,
    title: "Compra segura",
    desc: "Pagamento processado por gateway seguro e dados protegidos.",
  },
  {
    icon: Truck,
    title: "Frete grátis",
    desc: "Frete grátis e código de rastreio enviado pelo WhatsApp.",
  },
  {
    icon: Wallet,
    title: "Pagamento no PIX",
    desc: "Aprovação na hora, sem cartão e sem burocracia.",
  },
  {
    icon: ShieldCheck,
    title: "7 dias para devolver",
    desc: "Não gostou? Devolva em até 7 dias e receba 100% de volta.",
  },
];

export function TrustSection() {
  return (
    <section className="section bg-white">
      <div className="container-app grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl2 bg-cream-50 p-5 ring-1 ring-graphite-950/[0.04]">
            <Icon className="h-5 w-5 text-sage-600" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-bold text-graphite-950">{title}</p>
            <p className="mt-1 text-sm text-graphite-700/85">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TrustBar({
  className = "",
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "compact") {
    return (
      <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}>
        {ITEMS.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-1.5 text-sm">
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {title}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="rounded-xl2 bg-white p-5 shadow-card">
          <Icon className="h-5 w-5 text-sage-600" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-bold text-graphite-950">{title}</p>
          <p className="mt-1 text-sm text-graphite-700/85">{desc}</p>
        </div>
      ))}
    </div>
  );
}
