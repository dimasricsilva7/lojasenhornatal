"use client";

import { useEffect } from "react";
import { trackPixel } from "@/components/MetaPixel";

export default function ViewContentTracker({
  productId,
  productName,
  priceCents,
}: {
  productId: string;
  productName: string;
  priceCents: number;
}) {
  useEffect(() => {
    // Mesmo eventId no navegador e no servidor → o Meta conta 1 evento só.
    const eventId = crypto.randomUUID();
    trackPixel(
      "ViewContent",
      { content_ids: [productId], content_name: productName, value: priceCents / 100, currency: "BRL" },
      eventId
    );
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "view_content", eventId, metadata: { productId, productName } }),
      keepalive: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
