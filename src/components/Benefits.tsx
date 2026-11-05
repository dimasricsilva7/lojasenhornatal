import { Check, X, Lightbulb, Sparkles, Zap, TreePine, Ruler } from "lucide-react";

const IN_THE_BOX = [
  { icon: TreePine, title: "Árvore já montada", desc: "Verde tradicional, com a estrutura pronta. Nada de encaixar galho por galho." },
  { icon: Lightbulb, title: "Pisca-pisca instalado", desc: "As luzes já vêm distribuídas pelos galhos. Sem fio embolado." },
  { icon: Sparkles, title: "Enfeites inclusos", desc: "A partir de 50 enfeites, conforme o tamanho escolhido." },
  { icon: Zap, title: "Bivolt", desc: "Funciona em 110 V e 220 V, em qualquer lugar do Brasil." },
  { icon: Ruler, title: "3 tamanhos", desc: "1,20 m para apartamento e mesa de canto, 2,00 m e 2,20 m para salas e pé-direito alto." },
];

export function WhatsInTheBox() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">O que vem na caixa</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Tudo o que a sua árvore precisa, numa caixa só.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {IN_THE_BOX.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-surface p-5">
              <Icon className="h-6 w-6 text-sage-600" strokeWidth={1.75} />
              <p className="mt-3 font-bold text-graphite-950">{title}</p>
              <p className="mt-1 text-sm text-graphite-700/85">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROWS: [string, string, string][] = [
  ["Montagem", "Galho por galho, uma tarde inteira", "Já vem montada"],
  ["Pisca-pisca", "Comprado à parte e enrolado à mão", "Já instalado"],
  ["Enfeites", "Comprados à parte, na correria", "Inclusos (a partir de 50)"],
  ["Compras", "Árvore + luzes + bolas, em lojas diferentes", "Um pedido só, com frete grátis"],
];

export function Comparison() {
  return (
    <section className="section bg-white">
      <div className="container-app max-w-3xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Por que ela é diferente</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            A árvore comum vs. a árvore do Senhor Natal
          </h2>
        </div>
        <div className="mt-10 overflow-hidden rounded-xl2 ring-1 ring-graphite-950/[0.08]">
          <div className="grid grid-cols-[1fr_1.3fr_1.3fr] bg-cream-100 text-xs font-bold uppercase tracking-wide text-graphite-700 sm:text-sm">
            <div className="p-3 sm:p-4" />
            <div className="p-3 sm:p-4">Árvore comum</div>
            <div className="bg-sage-600 p-3 text-cream-50 sm:p-4">Senhor Natal</div>
          </div>
          {ROWS.map(([label, common, ours]) => (
            <div key={label} className="grid grid-cols-[1fr_1.3fr_1.3fr] border-t border-graphite-950/[0.06] text-sm">
              <div className="p-3 font-bold text-graphite-950 sm:p-4">{label}</div>
              <div className="flex gap-2 p-3 text-graphite-700 sm:p-4">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" strokeWidth={2.5} />
                {common}
              </div>
              <div className="flex gap-2 bg-sage-50 p-3 font-semibold text-graphite-950 sm:p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" strokeWidth={2.5} />
                {ours}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FOR_WHOM = [
  "Quem mora em apartamento e não tem espaço nem paciência para montar árvore grande peça por peça.",
  "Quem trabalha até tarde em dezembro e quer a casa pronta para receber a família.",
  "Quem quer dar de presente para os pais ou avós uma árvore que eles não precisam montar.",
  "Quem já cansou de gastar mais com enfeite e pisca do que com a própria árvore.",
];

export default function Benefits() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app max-w-3xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Para quem é</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">Feita para quem quer o Natal sem trabalho.</h2>
        </div>
        <ul className="mt-8 space-y-3">
          {FOR_WHOM.map((t) => (
            <li key={t} className="card-surface flex gap-3 p-4 text-base text-graphite-800">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
