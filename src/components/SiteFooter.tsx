import Link from "next/link";
import { POLICIES } from "@/lib/policies";

type FooterSettings = Record<string, string> & {
  store_name: string;
  contact_email: string;
};

function whatsappHref(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/55${digits}`;
}

export default function SiteFooter({ settings }: { settings: FooterSettings }) {
  return (
    <footer className="border-t border-graphite-900/10 bg-cream-50 py-12">
      <div className="container-app flex flex-col items-center gap-4 text-center text-sm text-graphite-700">
        <p className="text-base font-extrabold text-graphite-950">{settings.store_name}</p>
        <p>Frete grátis · Pagamento via PIX · Entrega em {settings.shipping_days || "3 a 5"} dias úteis</p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {settings.contact_whatsapp && (
            <a href={whatsappHref(settings.contact_whatsapp)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              WhatsApp {settings.contact_whatsapp}
            </a>
          )}
          {settings.contact_email && (
            <a href={`mailto:${settings.contact_email}`} className="underline underline-offset-2">
              {settings.contact_email}
            </a>
          )}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {POLICIES.map((p) => (
            <Link key={p.slug} href={`/politicas/${p.slug}`} className="underline underline-offset-2">
              {p.title}
            </Link>
          ))}
        </nav>

        {settings.company_info && (
          <p className="max-w-md whitespace-pre-line text-xs text-graphite-700/70">{settings.company_info}</p>
        )}

        <p className="mt-2 text-xs text-graphite-700/50">
          © {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
