"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SID_KEY = "sn_sid";
const SRC_KEY = "sn_src";

function sessionId() {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/** Origem da visita, guardada na primeira página da sessão. */
function source(): { source: string; campaign: string | null } {
  try {
    const saved = sessionStorage.getItem(SRC_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const q = new URLSearchParams(window.location.search);
  const utm = (q.get("utm_source") ?? "").toLowerCase();
  let src = "Direto";
  if (q.get("fbclid") || /facebook|instagram|^fb$|^ig$|meta/.test(utm)) src = "Facebook/Instagram";
  else if (q.get("gclid") || utm.includes("google")) src = "Google";
  else if (q.get("ttclid") || utm.includes("tiktok")) src = "TikTok";
  else if (utm) src = utm;
  else if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    try {
      src = new URL(document.referrer).hostname.replace(/^www\./, "");
    } catch {}
  }
  const value = { source: src, campaign: q.get("utm_campaign") };
  try {
    sessionStorage.setItem(SRC_KEY, JSON.stringify(value));
  } catch {}
  return value;
}

// Seção visível no momento (preenchida pelo IntersectionObserver abaixo).
let currentSection: string | null = null;

function send(path: string, nav: boolean) {
  const sid = sessionId();
  if (!sid) return;
  const body = JSON.stringify({ sid, path, nav, section: currentSection, ...source() });
  fetch("/api/ping", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}

/** Avisa a saída na hora (fechou a aba / navegou para fora), para não ficar "online" sem estar. */
function sendLeave() {
  const sid = sessionId();
  if (!sid) return;
  const blob = new Blob([JSON.stringify({ sid, left: true })], { type: "application/json" });
  navigator.sendBeacon?.("/api/ping", blob);
}

/** Mantém o visitante na lista "Online agora" do admin. */
export default function Pinger() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
    currentSection = null; // ao trocar de página, zera até o observer reavaliar
    if (pathname.startsWith("/admin")) return;
    send(pathname, true);
  }, [pathname]);

  // Observa as seções marcadas com data-sec e guarda a mais visível.
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-sec]"));
    if (els.length === 0) return;
    // Scrollspy: a seção ativa é a que cruza ~40% da altura da tela. Em trechos
    // sem rótulo, mantém a última seção rotulada (a de cima).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) currentSection = (e.target as HTMLElement).dataset.sec ?? currentSection;
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible" || pathRef.current.startsWith("/admin")) return;
      send(pathRef.current, false);
    };
    const id = setInterval(beat, 5_000);
    document.addEventListener("visibilitychange", beat);
    window.addEventListener("pagehide", sendLeave);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
      window.removeEventListener("pagehide", sendLeave);
    };
  }, []);

  return null;
}
