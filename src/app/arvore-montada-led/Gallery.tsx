"use client";

import { useState } from "react";

type Media = { type: "video" | "image"; url: string };

export default function Gallery({ video, images, off }: { video: string; images: string[]; off: number }) {
  // 1ª imagem como principal, vídeo em 2º, demais imagens depois.
  const [firstImage, ...restImages] = images;
  const media: Media[] = [
    ...(firstImage ? [{ type: "image" as const, url: firstImage }] : []),
    { type: "video", url: video },
    ...restImages.map((u) => ({ type: "image" as const, url: u })),
  ];
  const [active, setActive] = useState(0);
  const cur = media[active];

  return (
    <div>
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "3 / 4" }}>
        {off > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded bg-[#c0392b] px-2 py-1 text-xs font-bold text-white shadow">-{off}% OFF</span>
        )}
        {cur.type === "video" ? (
          <video src={cur.url} autoPlay muted loop playsInline className="h-full w-full object-cover" poster={images[0]} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.url} alt="Árvore de Natal Espiral LED" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        {media.map((m, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${active === i ? "border-[#c0392b]" : "border-transparent"}`}
          >
            {m.type === "video" ? (
              <>
                <video src={m.url} muted playsInline className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center text-white">▶</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
