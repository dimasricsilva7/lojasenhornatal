import { Clock, Unplug, ShoppingBag, TreePine, PackageOpen, Move, Plug } from "lucide-react";

const PAINS = [
  { icon: Clock, text: "Uma tarde inteira encaixando galho por galho, e ela ainda fica torta." },
  { icon: Unplug, text: "O pisca-pisca embolado do ano passado, que acende pela metade." },
  { icon: ShoppingBag, text: "A ida às pressas para comprar mais bola, porque a árvore ficou vazia." },
  { icon: TreePine, text: "No fim, uma árvore rala que não parece em nada com a que você imaginou." },
];

export function ProblemSection() {
  return (
    <section className="section bg-white">
      <div className="container-app max-w-3xl">
        <p className="eyebrow mb-4 text-center">Todo ano a mesma coisa</p>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
          Montar a árvore não precisava ser a parte mais cansativa do Natal.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {PAINS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-4 rounded-xl2 bg-cream-50 p-5 ring-1 ring-graphite-950/[0.04]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-600">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-base text-graphite-800">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-xl text-center text-lg font-semibold text-graphite-950">
          A árvore do Senhor Natal chega pronta. Você só escolhe o canto da sala.
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: PackageOpen, title: "Tire da caixa", desc: "A árvore já vem montada, com o pisca-pisca instalado e os enfeites no lugar." },
  { icon: Move, title: "Abra os galhos", desc: "Coloque no canto escolhido e ajuste os galhos com as mãos para deixá-la bem cheia." },
  { icon: Plug, title: "Ligue na tomada", desc: "É bivolt: funciona em 110 V ou 220 V. Pronto, a casa já está no clima do Natal." },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="section scroll-mt-16 bg-sage-700 text-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-sage-200">Como funciona</p>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pronta em 3 passos.</h2>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="rounded-xl2 bg-white/[0.07] p-6 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-500 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-sage-200" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-lg font-bold">{title}</p>
              <p className="mt-1.5 text-sm text-cream-50/80">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
