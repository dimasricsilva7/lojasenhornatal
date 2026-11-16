"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/** Barra fixa no rodapé (mobile) que leva pra calculadora de orçamento. */
export default function StickyWhats() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = () => {
    document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 p-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button type="button" onClick={go} className="btn-green w-full !py-3.5 text-base">
        <MessageCircle className="h-5 w-5" /> Montar orçamento e chamar no WhatsApp
      </button>
    </div>
  );
}
