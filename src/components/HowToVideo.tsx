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
      src={src}
      className="aspect-[9/16] h-auto w-full object-cover"
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
