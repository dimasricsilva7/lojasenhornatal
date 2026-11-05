"use client";

import { useEffect, useRef } from "react";

/**
 * Neve caindo sobre a página. Leve: canvas fixo que não bloqueia cliques,
 * menos flocos no celular, pausa com a aba oculta e desliga para quem
 * pediu "reduzir movimento" no sistema.
 */
export default function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Flake = { x: number; y: number; r: number; vy: number; vx: number; phase: number; alpha: number };
    let flakes: Flake[] = [];

    const make = (anyY: boolean): Flake => ({
      x: Math.random() * w,
      y: anyY ? Math.random() * h : -10,
      r: 1.6 + Math.random() * 2.8,
      vy: 0.35 + Math.random() * 0.9,
      vx: -0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.55 + Math.random() * 0.4,
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = w < 640 ? 45 : 90;
      flakes = Array.from({ length: target }, () => make(true));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy;
        f.x += f.vx + Math.sin(t + f.phase) * 0.3;
        if (f.y > h + 10) Object.assign(f, make(false));
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        // Branco com contorno suave: aparece tanto no fundo claro quanto no verde.
        ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
        ctx.shadowColor = "rgba(20,32,26,0.4)";
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === "visible") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[35]" />;
}
