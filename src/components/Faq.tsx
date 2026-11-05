const FAQ = (shippingDays: string) => [
  { q: "Ela vem montada mesmo?", a: "Sim. A árvore chega montada, com o pisca-pisca já instalado e os enfeites no lugar. Você só precisa posicionar, abrir os galhos com as mãos e ligar na tomada." },
  { q: "Quantos enfeites vêm?", a: "A partir de 50 enfeites, conforme o tamanho escolhido. As árvores maiores vêm com mais enfeites." },
  { q: "É bivolt?", a: "Sim. Funciona em 110 V e 220 V, em qualquer região do Brasil." },
  { q: "Qual tamanho escolher?", a: "1,20 m cabe bem em apartamento, mesa de canto ou quarto. 2,00 m é o tamanho mais comum para salas. 2,20 m é para salas amplas e pé-direito alto. Meça o espaço antes de escolher." },
  { q: "Qual o prazo de entrega?", a: `De ${shippingDays} dias úteis após a confirmação do pagamento, com frete grátis para todo o Brasil. Você recebe o código de rastreio pelo WhatsApp e pelo e-mail.` },
  { q: "E se chegar danificada?", a: "Trocamos sem custo. Envie uma foto pelo WhatsApp em até 7 dias após o recebimento e resolvemos a troca." },
  { q: "Posso devolver se não gostar?", a: "Pode. Você tem 7 dias após o recebimento para desistir da compra e receber 100% do valor de volta, como garante o Código de Defesa do Consumidor." },
  { q: "É seguro pagar no PIX?", a: "Sim. O PIX é gerado pelo nosso gateway de pagamento, no nome da loja, e o pedido é confirmado automaticamente. Os dados da empresa e os nossos contatos estão no rodapé desta página." },
  { q: "Como acompanho meu pedido?", a: "Assim que o pedido é enviado, você recebe o código de rastreio. Se tiver qualquer dúvida, fale com a gente pelo WhatsApp." },
];

export default function Faq({ shippingDays = "3 a 5" }: { shippingDays?: string }) {
  return (
    <section className="section bg-white">
      <div className="container-app max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Dúvidas frequentes</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">Perguntas que todo mundo faz</h2>
        </div>
        <div className="mt-8 divide-y divide-graphite-950/[0.08] rounded-xl2 bg-cream-50 ring-1 ring-graphite-950/[0.05]">
          {FAQ(shippingDays).map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-graphite-950 marker:hidden">
                {q}
                <span className="text-xl text-sage-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-graphite-700">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
