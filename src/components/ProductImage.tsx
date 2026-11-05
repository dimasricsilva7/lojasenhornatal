import Image from "next/image";
import { TreePine } from "lucide-react";

/** Mostra a foto do produto ou, enquanto nenhuma foto foi enviada no admin, um espaço neutro. */
export default function ProductImage({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05] sm:max-w-lg ${className}`}
    >
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 768px) 90vw, 520px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-sage-50 text-sage-600">
          <TreePine className="h-24 w-24" strokeWidth={1.25} />
          <span className="text-xs font-semibold uppercase tracking-widest text-sage-700/70">Foto do produto</span>
        </div>
      )}
    </div>
  );
}
