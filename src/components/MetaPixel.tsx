"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Envia o evento para todos os pixels. Se o script do Meta ainda não carregou
 * (1ª página da visita), espera até 10 s em vez de perder o evento.
 */
export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string, tries = 0) {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
    if (tries < 33) setTimeout(() => trackPixel(event, params, eventId, tries + 1), 300);
    return;
  }
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

/**
 * Pixels de várias contas ao mesmo tempo. Os IDs vêm do servidor (layout), porque
 * no navegador o Next só embute process.env.NEXT_PUBLIC_* escritos literalmente.
 * fbq('track', ...) dispara para TODOS os pixels inicializados, com o mesmo eventID,
 * então cada conta registra o evento uma única vez.
 */
export default function MetaPixel({ pixelIds }: { pixelIds: string[] }) {
  const PIXEL_IDS = pixelIds;
  const pathname = usePathname();

  const firstView = useRef(true);

  // O PageView da 1ª página sai junto com o init (abaixo); aqui só as navegações seguintes.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    if (PIXEL_IDS.length > 0) trackPixel("PageView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (PIXEL_IDS.length === 0) return null;

  const initCalls = PIXEL_IDS.map((id) => `fbq('init', '${id}');`).join("\n") + "\nfbq('track', 'PageView');";

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          ${initCalls}
        `}
      </Script>
      <noscript>
        {PIXEL_IDS.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        ))}
      </noscript>
    </>
  );
}
