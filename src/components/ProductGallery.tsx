import Image from "next/image";

/** Galeria com as fotos enviadas no admin (todas as fotos dos tamanhos, sem repetir). Some se não houver fotos. */
export default function ProductGallery({ images }: { images: string[] }) {
  const list = Array.from(new Set(images)).slice(0, 6);
  if (list.length < 2) return null;

  return (
    <section data-sec="Fotos do produto" className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Veja de perto</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">Cheia, iluminada e pronta para a sua sala.</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {list.map((src, i) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-xl2 bg-cream-100 shadow-card">
              <Image src={src} alt={`Árvore de Natal montada — foto ${i + 1}`} fill sizes="(max-width: 768px) 45vw, 360px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
