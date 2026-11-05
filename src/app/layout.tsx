import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import TrackingCapture from "@/components/TrackingCapture";
import Pinger from "@/components/Pinger";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Árvore de Natal Montada com Pisca-pisca e Enfeites | Senhor Natal",
    template: "%s | Senhor Natal",
  },
  description:
    "Árvore de Natal que já vem montada, com pisca-pisca e enfeites. Bivolt, tamanhos para sala e apartamento, frete grátis e 7 dias para devolução.",
  openGraph: {
    title: "Árvore de Natal Montada | Senhor Natal",
    description: "Vem achatada e decorada: encaixa o mastro, puxa e liga na tomada. Frete grátis e pagamento no PIX.",
    url: siteUrl,
    siteName: "Senhor Natal",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Árvore de Natal Montada | Senhor Natal",
    description: "Já vem montada, com pisca-pisca e enfeites. Frete grátis.",
  },
  robots: { index: true, follow: true },
};

/** NEXT_PUBLIC_META_PIXEL_ID, _2 … _10 — sem repetidos. */
function metaPixelIds() {
  const ids = Array.from({ length: 10 }, (_, i) => process.env[`NEXT_PUBLIC_META_PIXEL_ID${i === 0 ? "" : `_${i + 1}`}`]?.trim())
    .filter((id): id is string => Boolean(id));
  return Array.from(new Set(ids));
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body>
        <MetaPixel pixelIds={metaPixelIds()} />
        <TrackingCapture />
        <Pinger />
        {children}
      </body>
    </html>
  );
}
