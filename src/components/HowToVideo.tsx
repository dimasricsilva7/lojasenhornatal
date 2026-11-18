"use client";

import { useEffect, useRef } from "react";

/** Vídeo 9:16 do "como montar": só carrega e toca quando entra na tela (não concorre com a hero no load). */
export default function HowToVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      // #t=0.1 força o navegador a mostrar o 1º frame como poster (senão fica tela preta no iOS).
      src={src.includes("#") ? src : `${src}#t=0.1`}
      className="aspect-[9/16] h-auto w-full object-cover"
      muted
      loop
      autoPlay
      playsInline
      preload="metadata"
    />
  );
}
