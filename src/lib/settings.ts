import { db } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  store_name: "Senhor Natal",
  main_price_cents: "9700",
  compare_at_cents: "",
  shipping_days: "3 a 5",
  // Data-limite real informada pelo fornecedor (ex.: "15/12"). Vazio = a faixa não aparece.
  christmas_deadline: "",
  guarantee_text: "Você tem 7 dias após o recebimento para devolver e receber 100% do valor de volta",
  guarantee_days: "",
  guarantee_conditions:
    "Se a árvore chegar com defeito ou danificada no transporte, nós trocamos sem custo. Basta enviar uma foto pelo nosso WhatsApp em até 7 dias após o recebimento.",
  guarantee_how_to:
    "Fale com a gente pelo WhatsApp ou e-mail informando o número do pedido. Respondemos em até 1 dia útil e enviamos as instruções de devolução ou troca.",
  contact_email: "",
  contact_whatsapp: "",
  // Identificação do vendedor (Decreto 7.962/2013): razão social/nome, CNPJ ou CPF, endereço.
  company_info: "",
  spec_material: "",
  spec_dimensions: "",
  spec_weight: "",
  spec_package_contents: "",
  spec_cleaning: "",
  spec_usage: "",
  spec_capacity: "",
  spec_power: "",
  spec_battery: "",
  policy_privacy: "",
  policy_terms: "",
  policy_exchange: "",
  policy_delivery: "",
  demo_video_url: "",
  // Itens de "O que vem na caixa", um por linha (vazio = lista padrão).
  box_items: "",
  // Foto opcional dos itens da caixa (link).
  box_image_url: "",

  // ── Conteúdo do site (aba "Editar site"). Os valores abaixo são o texto atual;
  // editar no admin substitui, deixar vazio volta ao padrão do componente. ──
  // Hero
  hero_badge: "Árvore de Natal montada · Verde tradicional",
  hero_title: "Sua árvore de Natal pronta em minutos: já vem montada, com pisca-pisca e enfeites.",
  hero_subtitle:
    "Nada de passar a tarde abrindo galho, desembaraçando fio e correndo atrás de enfeite. Ela vem achatada na caixa, já decorada: você encaixa o mastro, puxa a árvore para cima e liga na tomada.",
  // Imagem da hero (link ou upload). Vazio = usa a foto do produto.
  hero_image_url: "",
  // "Todo ano a mesma coisa"
  problem_eyebrow: "Todo ano a mesma coisa",
  problem_title: "Montar a árvore não precisava ser a parte mais cansativa do Natal.",
  // Um problema por linha (os ícones são fixos).
  problem_pains:
    "Uma tarde inteira encaixando galho por galho, e ela ainda fica torta.\nO pisca-pisca embolado do ano passado, que acende pela metade.\nA ida às pressas para comprar mais bola, porque a árvore ficou vazia.\nNo fim, uma árvore rala que não parece em nada com a que você imaginou.",
  problem_closing: "A árvore do Senhor Natal chega pronta. Você só escolhe o canto da sala.",
  // "Como montar"
  howto_eyebrow: "Como montar",
  howto_title: "Pronta em poucos minutos, em 3 passos.",
  // Um passo por linha, no formato  Título | Descrição
  howto_steps:
    "Encaixe o mastro | Monte o mastro central e tire a árvore da caixa: ela vem achatada, já com laços, bolas, flores e pisca-pisca no lugar.\nPuxe para cima | Levante a árvore pelo mastro, como uma sanfona, e prenda no topo. Ela abre inteira, já decorada.\nLigue na tomada | É bivolt: funciona em 110 V ou 220 V. Pronto, a casa já está no clima do Natal.",
  // "O que vem na caixa"
  box_eyebrow: "O que vem na caixa",
  box_title: "A árvore e toda a decoração, numa caixa só.",
  box_subtitle: "Tudo já vem preso nos galhos. Você não precisa comprar nem pendurar nada.",
  box_footnote: "A quantidade de enfeites varia conforme o tamanho (a partir de 50). Bivolt: 110 V e 220 V.",
  // Comparação
  comparison_eyebrow: "Por que ela é diferente",
  comparison_title: "A árvore comum vs. a árvore do Senhor Natal",
  // Uma linha por item, no formato  Rótulo | Árvore comum | Senhor Natal
  comparison_rows:
    "Montagem | Galho por galho, uma tarde inteira | Já vem montada\nPisca-pisca | Comprado à parte e enrolado à mão | Já instalado\nEnfeites | Comprados à parte, na correria | Inclusos (a partir de 50)\nCompras | Árvore + luzes + bolas, em lojas diferentes | Um pedido só, com frete grátis\nEm janeiro | Desmontar enfeite por enfeite | Abaixa, fecha achatada e guarda decorada",
  // "Para quem é"
  forwhom_eyebrow: "Para quem é",
  forwhom_title: "Feita para quem quer o Natal sem trabalho.",
  // Um item por linha.
  forwhom_items:
    "Quem mora em apartamento e não tem espaço nem paciência para montar árvore grande peça por peça.\nQuem trabalha até tarde em dezembro e quer a casa pronta para receber a família.\nQuem quer dar de presente para os pais ou avós uma árvore que eles não precisam montar.\nQuem já cansou de gastar mais com enfeite e pisca do que com a própria árvore.",
  // Seção de produtos (cards)
  products_eyebrow: "Escolha o seu tamanho",
  products_title: "Qual árvore combina com a sua casa?",
  products_subtitle: "Todas já vêm montadas, com pisca-pisca e enfeites. Frete grátis para todo o Brasil.",
  // Perguntas frequentes (as perguntas em si são automáticas; aqui só o cabeçalho)
  faq_eyebrow: "Dúvidas frequentes",
  faq_title: "Perguntas que todo mundo faz",
  // Chamada final
  finalcta_title: "Este ano, a árvore chega pronta e você só aproveita.",
  finalcta_cta: "ESCOLHER MEU TAMANHO",
};

export type SettingsMap = Record<string, string> & typeof DEFAULT_SETTINGS;

/** Linhas não-vazias de um campo multilinha. */
export function settingLines(value: string): string[] {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

/** Linhas de um campo multilinha separadas por "|" (ex.: passos, comparação). */
export function settingRows(value: string): string[][] {
  return settingLines(value).map((l) => l.split("|").map((c) => c.trim()));
}

export async function getSettings(): Promise<SettingsMap> {
  const rows = await db.setting.findMany();
  const map: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string) {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
