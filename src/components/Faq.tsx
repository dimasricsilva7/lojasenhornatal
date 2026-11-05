import type { SettingsMap } from "@/lib/settings";

function sizeAnswer(labels: string[]) {
  if (labels.length === 0) return "Meça o espaço antes de escolher.";
  if (labels.length === 1) return `A árvore tem ${labels[0]}. Meça o espaço antes de comprar.`;
  const [first, ...rest] = labels;
  const last = rest.pop() as string;
  const middle = rest.length ? ` ${rest.join(" e ")} é o tamanho mais comum para salas.` : "";
  return `${first} cabe bem em apartamento, cantinho da sala ou quarto.${middle} ${last} é para salas amplas e pé-direito alto. Meça o espaço antes de escolher.`;
}

const FAQ = (shippingDays: string, sizes: string[]) => [
  { q: "Ela vem montada mesmo?", a: "Sim. A árvore chega achatada na caixa, já decorada e com o pisca-pisca instalado. Você encaixa o mastro central, puxa a árvore para cima, prende no topo e liga na tomada. Leva poucos minutos." },
  { q: "Como guardo depois do Natal?", a: "É só abaixar a árvore pelo mastro: ela fecha achatada, com a decoração no lugar, e volta para a caixa. No ano seguinte, é só puxar de novo." },
  { q: "Quantos enfeites vêm?", a: "A partir de 50 enfeites, conforme o tamanho escolhido. As árvores maiores vêm com mais enfeites." },
  { q: "É bivolt?", a: "Sim. Funciona em 110 V e 220 V, em qualquer região do Brasil." },
  { q: "Qual tamanho escolher?", a: sizeAnswer(sizes) },
  { q: "Qual o prazo de entrega?", a: `De ${shippingDays} dias úteis após a confirmação do pagamento, com frete grátis para todo o Brasil. Você recebe o código de rastreio pelo WhatsApp e pelo e-mail.` },
  { q: "E se chegar danificada?", a: "Trocamos sem custo. Envie uma foto pelo WhatsApp em até 7 dias após o recebimento e resolvemos a troca." },
  { q: "Posso devolver se não gostar?", a: "Pode. Você tem 7 dias após o recebimento para desistir da compra e receber 100% do valor de volta, como garante o Código de Defesa do Consumidor." },
  { q: "É seguro pagar no PIX?", a: "Sim. O PIX é gerado pelo nosso gateway de pagamento, no nome da loja, e o pedido é confirmado automaticamente. Os dados da empresa e os nossos contatos estão no rodapé desta página." },
  { q: "Como acompanho meu pedido?", a: "Assim que o pedido é enviado, você recebe o código de rastreio. Se tiver qualquer dúvida, fale com a gente pelo WhatsApp." },
];

export default function Faq({ shippingDays = "3 a 5", sizes = [], settings }: { shippingDays?: string; sizes?: string[]; settings: SettingsMap }) {
  return (
    <section data-sec="Perguntas" className="section bg-clay-600">
      <div className="container-app max-w-2xl">
        <div className="text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">{settings.faq_eyebrow}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{settings.faq_title}</h2>
        </div>
        <div className="mt-8 divide-y divide-white/15 rounded-xl2 bg-white/10 ring-1 ring-white/20">
          {FAQ(shippingDays, sizes).map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white marker:hidden">
                {q}
                <span className="text-xl text-white transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-white/85">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
