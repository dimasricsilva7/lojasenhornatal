"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Deterrentes anti-cópia (client-side) para a página da campanha.
 * Bloqueia clique-direito, arrastar, seleção/cópia de texto e atalhos de
 * devtools/ver-fonte, e mostra uma imagem de aviso em tela cheia na tentativa.
 *
 * IMPORTANTE: é apenas deterrente — não impede quem desliga o JS, usa curl,
 * `view-source:` ou tira print. Campos de formulário e elementos marcados com
 * `data-allow-copy` (ex.: código PIX) continuam funcionando normalmente.
 */
export default function CopyGuard({ image }: { image: string }) {
  const [blocked, setBlocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trigger = () => {
      setBlocked(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBlocked(false), 4000);
    };
    const editable = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest('input, textarea, [contenteditable="true"], [data-allow-copy]');

    const onContext = (e: MouseEvent) => { e.preventDefault(); trigger(); };
    const onDrag = (e: Event) => { e.preventDefault(); };
    const onCopy = (e: Event) => { if (!editable(e.target)) { e.preventDefault(); trigger(); } };
    const onSelectStart = (e: Event) => { if (!editable(e.target)) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const block =
        e.key === "F12" ||
        (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) || // devtools
        (ctrl && (k === "u" || k === "s")) ||                            // ver-fonte / salvar
        (ctrl && !editable(e.target) && (k === "c" || k === "x" || k === "a")); // copiar/recortar/selecionar tudo
      if (block) { e.preventDefault(); trigger(); }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <style>{`
        body { -webkit-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }
        input, textarea, select, [contenteditable="true"], [data-allow-copy], [data-allow-copy] * {
          -webkit-user-select: text; -ms-user-select: text; user-select: text; -webkit-touch-callout: default;
        }
        img, video { -webkit-user-drag: none; user-drag: none; }
      `}</style>
      {blocked && (
        <div
          onClick={() => setBlocked(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          role="alertdialog"
          aria-label="Conteúdo protegido"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Conteúdo protegido — cópia não autorizada" className="max-h-full max-w-full object-contain" draggable={false} />
        </div>
      )}
    </>
  );
}
