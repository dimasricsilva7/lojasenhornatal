import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  Building2,
  HeartHandshake,
  Store,
  ChefHat,
  BadgeCheck,
  Clock,
  HandCoins,
  Truck,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FileText,
  Star,
} from "lucide-react";
import { whatsappHref, WHATSAPP_NUMBER, MIN_PIECES } from "@/lib/atacado";
import QuoteBuilder from "./QuoteBuilder";
import SocialProofStrip from "./SocialProofStrip";
import StickyWhats from "./StickyWhats";

export const metadata: Metadata = {
  title: "Atacado de Panetones e Chocotones para Empresas e Doação | Senhor Natal",
  description:
    "Panetones e chocotones no atacado para brindes de empresa, ações sociais e revenda. Preço por volume, caseiro e Bauducco, sob encomenda com sinal de 50%. Faça seu orçamento no WhatsApp.",
  alternates: { canonical: "/atacado-panetone" },
  openGraph: {
    title: "Atacado de Panetones e Chocotones | Senhor Natal",
    description:
      "Brindes de Natal para empresas, doação e revenda. Orçamento rápido no WhatsApp, sob encomenda com sinal de 50%.",
    type: "website",
  },
};

const heroHref = whatsappHref(
  "Olá, Senhor Natal! 🎄 Vim pela página de atacado e quero um orçamento de panetones."
);

function TrustBar() {
  const items = [
    { icon: ChefHat, text: "Caseiro artesanal + marca Bauducco" },
    { icon: HandCoins, text: "Preço que cai com o volume" },
    { icon: Truck, text: "Enviamos p/ todo o Brasil · com rastreio" },
    { icon: BadgeCheck, text: "Nota fiscal pra sua empresa" },
  ];
  return (
    <div className="border-y border-graphite-900/10 bg-cream-25">
      <div className="container-app grid grid-cols-2 gap-x-6 gap-y-3 py-4 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.text} className="flex items-center gap-2 text-xs font-semibold text-graphite-700 sm:text-sm">
            <it.icon className="h-4 w-4 shrink-0 text-sage-600" />
            {it.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AtacadoPanetonePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Header enxuto e independente */}
      <header className="relative z-10 border-b border-graphite-900/10 bg-cream-50/90 backdrop-blur">
        <div className="container-app flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-clay-600" />
            <span className="text-lg font-extrabold tracking-tight text-graphite-950">
              Senhor Natal <span className="font-semibold text-clay-600">· Atacado</span>
            </span>
          </div>
          <a href={heroHref} target="_blank" rel="noopener noreferrer" className="btn-green !px-4 !py-2.5 text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 overflow-hidden bg-graphite-950">
        {/* Foto de fundo em toda a hero */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/atacado/hero.png"
            alt="Padeiro finalizando panetones e chocotones artesanais"
            className="h-full w-full object-cover object-[72%_center]"
          />
          {/* escurece um pouco a foto toda */}
          <div className="pointer-events-none absolute inset-0 bg-graphite-950/35" />
          {/* degradê da esquerda (escuro) para a direita (foto aparece) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/70 to-graphite-950/15" />
          {/* reforço vertical no mobile p/ o texto embaixo ficar legível */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-950/85 via-graphite-950/35 to-graphite-950/55 lg:hidden" />
        </div>
        <div className="container-app relative z-10 grid gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="animate-fadeUp">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-amber-300 [text-shadow:0_1px_8px_rgba(0,0,0,0.75)]">
              🎄 Pedidos de Natal no atacado · vagas de produção acabando
            </p>
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
              Panetone de verdade pra{" "}
              <span className="text-amber-300">presentear, doar e fidelizar</span> neste Natal.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-cream-100">
              Do caseiro artesanal à marca Bauducco. Quanto maior o pedido,{" "}
              <strong className="text-white">menor o preço por unidade</strong>. Você monta o orçamento aqui e
              fecha num papo rápido no WhatsApp — com atendimento humano do início ao fim.
            </p>

            <ul className="mt-6 space-y-2">
              {[
                "Ideal pra brindes de empresa, ações sociais e revenda",
                "Enviamos para todo o Brasil com rastreio — prazo a partir de 5 dias após o início da produção",
                `Pedido mínimo de ${MIN_PIECES} unidades · sinal de 50% reserva sua produção`,
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-cream-50">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#orcamento" className="btn-primary !py-4 text-base">
                Montar meu orçamento agora
              </Link>
              <a
                href={heroHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 !py-4 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              </a>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs text-cream-200/90">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Centenas de panetones entregues
              na temporada passada
            </p>
          </div>

          {/* Card de destaque de preço */}
          <div className="animate-fadeUp lg:justify-self-end">
            <div className="card-surface w-full max-w-md overflow-hidden">
              <div className="bg-clay-600 px-6 py-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-wide text-clay-50">A partir de</p>
                <p className="text-4xl font-extrabold">
                  R$ 3,87 <span className="text-base font-semibold text-clay-50">/ panetone 400g</span>
                </p>
                <p className="text-sm text-clay-50">no caseiro, acima de 1.000 unidades</p>
              </div>
              <div className="space-y-3 px-6 py-5">
                {[
                  ["Panetone/Chocotone caseiro 400g", "R$ 6,65 a R$ 3,87 / un"],
                  ["Mini panetone caseiro (caixa 24 un)", "R$ 64,90 / caixa"],
                  ["Caixa Bauducco 400g (10 un)", "R$ 144,90 a R$ 154,90"],
                  ["Caixa Bauducco mini 80g (24 un)", "R$ 74,90 a R$ 86,90"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-graphite-900/5 pb-2 text-sm last:border-0">
                    <span className="text-graphite-700">{k}</span>
                    <span className="whitespace-nowrap font-bold text-graphite-950">{v}</span>
                  </div>
                ))}
                <Link href="#orcamento" className="btn-green mt-2 w-full">
                  Ver preço do meu volume
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* NOSSOS PRODUTOS */}
      <section className="section relative z-10 overflow-hidden bg-white">
        <div className="container-app relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">Feitos pra impressionar</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Nossos panetones caseiros
            </h2>
            <p className="mt-3 text-graphite-600">
              Massa artesanal macia e bem recheada. No tamanho que o seu pedido pedir — com preço que cai
              conforme o volume.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                img: "/images/atacado/prod-panetone.png",
                name: "Panetone caseiro 400g",
                desc: "Frutas cristalizadas e passas na medida certa.",
                price: "R$ 6,65 a R$ 3,87 / un",
              },
              {
                img: "/images/atacado/prod-chocotone.png",
                name: "Chocotone caseiro 400g",
                desc: "Recheado de gotas de chocolate de verdade.",
                price: "R$ 6,65 a R$ 3,87 / un",
              },
              {
                img: "/images/atacado/prod-mini-panetone.png",
                name: "Mini panetone 100g",
                desc: "Caixa fechada com 24 un — perfeito pra brinde.",
                price: "R$ 64,90 / caixa",
              },
              {
                img: "/images/atacado/prod-mini-chocotone.png",
                name: "Mini chocotone 100g",
                desc: "Caixa fechada com 24 un — gotas de chocolate.",
                price: "R$ 64,90 / caixa",
              },
            ].map((p) => (
              <div key={p.name} className="group card-surface overflow-hidden text-center">
                <div className="flex h-56 items-center justify-center bg-gradient-to-b from-cream-50 to-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-extrabold text-graphite-950">{p.name}</h3>
                  <p className="mt-1 text-sm text-graphite-600">{p.desc}</p>
                  <p className="mt-2 font-bold text-clay-600">{p.price}</p>
                  <Link href="#orcamento" className="btn-green mt-4 w-full">
                    Montar orçamento
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-graphite-500">
            Também trabalhamos com <strong>caixas fechadas da marca Bauducco</strong> (400g e mini). Monte seu
            orçamento e veja todos os preços.
          </p>
        </div>
      </section>

      {/* CHEF */}
      <section className="section relative z-10 bg-cream-25">
        <div className="container-app grid gap-8 lg:grid-cols-[minmax(260px,380px)_1fr] lg:items-center">
          <div className="mx-auto w-full max-w-sm lg:mx-0">
            <div className="relative overflow-hidden rounded-xl2 shadow-lift ring-1 ring-graphite-900/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/atacado/chef-tainan.png"
                alt="Chef Tainan Vitor"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-graphite-950/80 to-transparent p-4">
                <p className="text-sm font-bold text-white">Chef Tainan Vitor</p>
                <p className="text-xs text-cream-200">+25 anos de panificação artesanal</p>
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">Quem assina a qualidade</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Chef Tainan Vitor
            </h2>
            <div className="mt-4 space-y-3 text-graphite-700">
              <p>
                Com mais de <strong>25 anos de dedicação à gastronomia</strong>, o Chef Tainan Vitor construiu
                sua trajetória movido pela paixão pela panificação artesanal e pela arte de criar produtos de
                qualidade.
              </p>
              <p>
                Especialista em <strong>panetones e chocotones</strong>, acredita que o segredo de um produto
                excepcional está na seleção dos ingredientes, no cuidado com cada etapa da produção e no respeito
                às tradições.
              </p>
              <p>
                Seu trabalho valoriza massas macias, ingredientes selecionados, sabor marcante e acabamento
                cuidadoso. Neste Natal, compartilha sua paixão pela confeitaria, levando qualidade e tradição para
                famílias, empresas e parceiros em <strong>todo o Brasil</strong>.
              </p>
            </div>
            <p className="mt-5 border-l-4 border-clay-500 pl-4 text-lg font-extrabold text-graphite-950">
              Chef Tainan Vitor — tradição, dedicação e sabor em cada detalhe.
            </p>
          </div>
        </div>
      </section>

      {/* PRA QUEM É */}
      <section className="section relative z-10">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">Feito pra quem compra em quantidade</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Seu Natal resolvido, seja qual for o motivo
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Building2,
                title: "Empresas",
                desc: "Presenteie colaboradores e clientes com um brinde que todo mundo leva pra casa e lembra da sua marca. Nota fiscal e entrega combinada.",
              },
              {
                icon: HeartHandshake,
                title: "Doação & Caridade",
                desc: "Leve o sabor do Natal pra famílias, igrejas e instituições. Preço de atacado pra sua ação social alcançar mais gente.",
              },
              {
                icon: Store,
                title: "Revenda",
                desc: "Compre barato, venda com boa margem. Caseiro artesanal e Bauducco com preço que fecha a conta no fim do ano.",
              },
            ].map((c) => (
              <div key={c.title} className="card-surface p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-700">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-graphite-950">{c.title}</h3>
                <p className="mt-2 text-sm text-graphite-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA / SOLUÇÃO */}
      <section className="section relative z-10 bg-white">
        <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow mb-3">O que ninguém te conta sobre comprar no fim do ano</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Deixar pra última hora custa caro — e sai mais caro ainda.
            </h2>
            <div className="mt-6 space-y-4 text-graphite-700">
              <p>
                Em dezembro, fornecedor bom fica sem estoque, preço dispara e você acaba pagando mais
                por um produto pior — correndo o risco de não receber a tempo da sua confraternização ou
                da sua ação social.
              </p>
              <p>
                Quem se organiza agora <strong>trava o preço</strong>, garante a produção e entrega o
                Natal sem estresse. É exatamente isso que a gente faz por você.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ["❌ Última hora", "Sem estoque, preço alto, qualidade duvidosa, entrega incerta."],
              ["✅ Com a Senhor Natal", "Preço travado por volume, produção garantida e data de entrega combinada."],
            ].map(([k, v], i) => (
              <div
                key={k}
                className={`rounded-xl2 p-5 ${i === 0 ? "bg-clay-50 ring-1 ring-clay-100" : "bg-sage-50 ring-1 ring-sage-200"}`}
              >
                <p className="font-extrabold text-graphite-950">{k}</p>
                <p className="mt-1 text-sm text-graphite-700">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULADORA DE ORÇAMENTO */}
      <section id="orcamento" className="section relative z-10 scroll-mt-4 bg-cream-50">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">Monte e veja o preço na hora</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Calculadora de orçamento
            </h2>
            <p className="mt-3 text-graphite-600">
              Escolha as quantidades, preencha seus dados e chame no WhatsApp já com tudo pronto. Sem
              compromisso — o valor fecha quando você aprovar.
            </p>
          </div>

          <div className="mt-8">
            <QuoteBuilder />
          </div>

          {/* Política de encomenda + sinal (bem clara) */}
          <div className="mx-auto mt-8 max-w-3xl rounded-xl2 border border-clay-100 bg-clay-50 p-5">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-clay-600" />
              <div className="text-sm text-graphite-800">
                <p className="font-extrabold text-clay-700">Como funciona o pedido (leia antes de enviar):</p>
                <p className="mt-1">
                  Pedido <strong>mínimo de {MIN_PIECES} unidades</strong>. Todos os panetones são{" "}
                  <strong>produzidos/separados sob encomenda</strong>. Para iniciar a produção é necessário um{" "}
                  <strong>sinal de 50%</strong> do valor; o restante é acertado na entrega, conforme combinado no
                  WhatsApp.
                </p>
                <p className="mt-2 flex items-start gap-1.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />
                  <span>
                    <strong>Enviamos para todo o Brasil</strong>, com <strong>pedido rastreável</strong>. Prazo{" "}
                    <strong>a partir de 5 dias</strong> após o início da produção (confirmado no WhatsApp).
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section relative z-10">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">Simples e sem burocracia</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Do orçamento à entrega em 4 passos
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, t: "1. Monte o orçamento", d: "Escolha os produtos e quantidades aqui na página." },
              { icon: MessageCircle, t: "2. Fale no WhatsApp", d: "A gente confirma tudo e tira suas dúvidas com atendimento humano." },
              { icon: HandCoins, t: "3. Sinal de 50%", d: "Você paga o sinal e a gente inicia a produção do seu pedido." },
              { icon: Truck, t: "4. Enviamos p/ todo o Brasil", d: "Pedido rastreável, prazo a partir de 5 dias após o início da produção." },
            ].map((s) => (
              <div key={s.t} className="card-surface p-5 text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay-600">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-graphite-950">{s.t}</h3>
                <p className="mt-1 text-sm text-graphite-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialProofStrip />

      {/* CONFIANÇA / HUMANIZADO */}
      <section className="section relative z-10 bg-sage-600 text-white">
        <div className="container-app grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sage-100">Gente de verdade te atendendo</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Transparência do começo ao fim. Sem letra miúda.
            </h2>
            <p className="mt-4 text-sage-50">
              Aqui você conversa com pessoas, não com robô. A gente te mostra tudo antes: preço, prazo,
              forma de pagamento e entrega. Você só paga o sinal quando estiver 100% seguro do pedido —
              e o combinado é combinado.
            </p>
            <a
              href={heroHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-sage-700 shadow-soft transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp agora
            </a>
          </div>
          <div className="grid gap-3">
            {[
              { Icon: ShieldCheck, t: "Preço e condições por escrito antes de qualquer pagamento" },
              { Icon: BadgeCheck, t: "Emitimos nota fiscal pra sua empresa ou instituição" },
              { Icon: HandCoins, t: "Sinal de 50% só pra reservar sua produção — sem pegadinha" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-center gap-3 rounded-xl2 bg-white/10 p-4 backdrop-blur">
                <Icon className="h-6 w-6 shrink-0 text-sage-100" />
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section relative z-10 bg-white">
        <div className="container-app mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow mb-3">Ainda com dúvida?</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
              Perguntas frequentes
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "Qual o pedido mínimo?",
                a: `O pedido mínimo é de ${MIN_PIECES} unidades. Monte seu orçamento na calculadora — ela só libera o envio quando você atinge o mínimo. Dúvida? Chame no WhatsApp que a gente te orienta.`,
              },
              {
                q: "Vocês entregam em todo o Brasil? O pedido é rastreável?",
                a: "Sim! Enviamos para todo o Brasil e o seu pedido é rastreável — você acompanha a entrega. O prazo começa a partir de 5 dias após o início da produção; o prazo exato é confirmado no WhatsApp conforme a sua cidade e o volume.",
              },
              {
                q: "Por que precisa de sinal de 50%?",
                a: "Porque os panetones são produzidos/separados sob encomenda, especialmente pro seu pedido. O sinal reserva a sua produção e garante sua data. O restante é acertado na entrega.",
              },
              {
                q: "Qual o prazo de produção e entrega?",
                a: "O prazo começa a partir de 5 dias após o início da produção (que arranca com o sinal de 50%), e varia conforme o volume e a sua cidade. Em dezembro as vagas de produção se esgotam, então quanto antes fechar, melhor. Combinamos o prazo exato no WhatsApp.",
              },
              {
                q: "Vocês emitem nota fiscal?",
                a: "Sim. Emitimos nota fiscal para empresas e instituições. Só avisar no atendimento.",
              },
              {
                q: "Qual a diferença do caseiro pro Bauducco?",
                a: "O caseiro é artesanal, com massa macia e bem recheada, e tem preço que cai conforme o volume. O Bauducco é a marca conhecida, em caixas fechadas — ótimo quando o nome importa no presente.",
              },
              {
                q: "Como faço o pagamento?",
                a: "O sinal e o restante são combinados direto com a gente no WhatsApp, da forma que for mais prática pra você. Tudo transparente e por escrito antes.",
              },
            ].map((f) => (
              <details key={f.q} className="group card-surface p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-graphite-950">
                  {f.q}
                  <span className="text-clay-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-graphite-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section relative z-10 bg-graphite-950 text-white">
        <div className="container-app text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/atacado/prod-mini-chocotone.gif"
            alt="Mini chocotone caseiro"
            loading="lazy"
            className="mx-auto mb-6 h-40 w-auto object-contain drop-shadow-xl sm:h-48"
          />
          <h2 className="mx-auto max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            As vagas de produção de dezembro são limitadas. Garanta as suas agora.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream-200">
            Monte seu orçamento em 1 minuto e fale com a gente. Quanto antes você fechar, melhor o preço
            e mais tranquila a sua entrega.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="#orcamento" className="btn-primary !py-4 text-base">
              Montar meu orçamento
            </Link>
            <a href={heroHref} target="_blank" rel="noopener noreferrer" className="btn-green !py-4 text-base">
              <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER independente */}
      <footer className="relative z-10 bg-graphite-900 py-8 text-center text-sm text-cream-200">
        <div className="container-app space-y-1">
          <p className="font-bold text-white">Senhor Natal · Atacado de Panetones</p>
          <p>Atendimento pelo WhatsApp {`(${WHATSAPP_NUMBER.slice(2, 4)}) ${WHATSAPP_NUMBER.slice(4, 9)}-${WHATSAPP_NUMBER.slice(9)}`}</p>
          <p className="text-xs text-cream-200/60">© {new Date().getFullYear()} Senhor Natal. Todos os direitos reservados.</p>
        </div>
      </footer>

      <StickyWhats />
    </main>
  );
}
