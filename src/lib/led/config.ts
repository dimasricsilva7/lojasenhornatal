// ─────────────────────────────────────────────────────────────────────────────
// CAMPANHA ISOLADA: Árvore de Natal Espiral LED 1,80m  (rota /arvore-montada-led)
// Fonte única da oferta: o seed cria os Products a partir daqui e a página
// renderiza a partir daqui. Pedidos desta campanha ficam marcados com
// campaign = CAMPAIGN (não se misturam com a loja principal).
// ─────────────────────────────────────────────────────────────────────────────

export const CAMPAIGN = "arvore-led";
export const MAIN_SLUG = "led-arvore-espiral-180";

export type LedItem = {
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  blurb?: string;
};

export const MAIN = {
  slug: MAIN_SLUG,
  name: "Árvore de Natal Espiral LED 1,80m com Estrela e Enfeites",
  priceCents: 6790,
  compareAtCents: 13225,
  // Vídeo do produto + fotos reais (galeria). A 1ª imagem é a principal; o vídeo vem em 2º.
  videoUrl: "https://down-bs-br.vod.susercontent.com/api/v4/11110105/mms/br-11110105-6v5dk-me18xh7j1s7615.16000081756543209.mp4",
  images: [
    "/images/led/arvore-espiral-1.webp",
    "/images/led/arvore-espiral-2.webp",
    "/images/led/arvore-espiral-3.webp",
    "/images/led/arvore-espiral-4.webp",
  ],
};

// 6 order bumps (marcar no checkout). Preços em centavos.
export const ORDER_BUMPS: LedItem[] = [
  { slug: "led-bump-enfeites-vermelhos", name: "42 Enfeites Vermelhos para Árvore (pendentes)", priceCents: 3490, image: "https://down-br.img.susercontent.com/file/br-11134207-820lh-muyw5iuhc9he77@resize_w900_nl.webp", blurb: "Deixe a árvore ainda mais cheia com 42 pendentes vermelhos." },
  { slug: "led-bump-enfeites-dourados", name: "42 Enfeites Dourados para Árvore (pendentes)", priceCents: 3490, image: "https://down-br.img.susercontent.com/file/br-11134207-820l8-muyw5iuhdo1uae.webp", blurb: "Toque elegante: 42 pendentes dourados." },
  { slug: "led-bump-pendentes-sortidos", name: "18 Pendentes Sortidos Natalinos 12cm", priceCents: 2990, image: "https://down-br.img.susercontent.com/file/sg-11134201-82597-ms5rmvbzssue69@resize_w900_nl.webp", blurb: "18 pendentes sortidos de 12cm para variar a decoração." },
  { slug: "led-bump-capas-almofadas", name: "Kit 4 Capas para Almofadas Natalinas 45x45cm", priceCents: 4490, image: "https://down-br.img.susercontent.com/file/br-11134207-820m2-mqz4129z2m8466@resize_w900_nl.webp", blurb: "Combine o sofá com a árvore: 4 capas natalinas 45x45." },
  { slug: "led-bump-cascata-estrela", name: "Luz LED Cascata Pisca-Pisca Estrela e Papai Noel (Bivolt)", priceCents: 3490, image: "https://down-br.img.susercontent.com/file/br-11134207-820ly-muapiypbbvnm11.webp", blurb: "Mais brilho na janela ou parede com a cascata LED." },
  { slug: "led-bump-papai-noel-escalando", name: "Papai Noel Escalando - Enfeite de Natal", priceCents: 4790, image: "https://down-br.img.susercontent.com/file/br-11134207-820mf-mt3ibrgreih1fa.webp", blurb: "O clássico Papai Noel escalando para divertir a criançada." },
];

// 2 upsells (oferta especial no checkout, no mesmo PIX).
export const UPSELLS: LedItem[] = [
  { slug: "led-upsell-cervos-led", name: "3 Peças Cervos de Ferro ArtElk com Luz LED (Decoração Jardim)", priceCents: 7990, image: "https://down-br.img.susercontent.com/file/sg-11134201-8259o-mftfyn1jls0ddc.webp", blurb: "Trio de cervos iluminados: a decoração que vira atração da casa." },
  { slug: "led-upsell-cascata-400", name: "Cascata Natal 400 Lâmpadas LED Fixo - 10m Fio Branco", priceCents: 4990, image: "https://down-br.img.susercontent.com/file/br-11134207-7r98o-mdl389o873y1ca.webp", blurb: "10 metros de luz para varanda, muro ou teto. Efeito profissional." },
];

export const ALL_ADDONS: LedItem[] = [...ORDER_BUMPS, ...UPSELLS];

export type LedReview = {
  name: string;
  city: string;
  text: string;
  mediaUrl: string;
  mediaType: "video" | "image";
};

export const REVIEWS: LedReview[] = [
  { name: "Juliana M.", city: "São Paulo, SP", text: "Árvore linda! Ficou muito mais bonita do que eu esperava. Os enfeites são delicados e a iluminação LED dá um charme especial.", mediaUrl: "https://down-ws-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfko-m3fhqig25gl4ad.16000051733433845.mp4", mediaType: "video" },
  { name: "Patrícia R.", city: "Belo Horizonte, MG", text: "Chegou muito bem embalada e dentro do prazo. O produto é bonito, bem-acabado e deixou minha decoração de Natal maravilhosa.", mediaUrl: "https://down-ws-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfko-m2efp7hdzhvq7c.16000051731190644.mp4", mediaType: "video" },
  { name: "Camila S.", city: "Curitiba, PR", text: "Adorei a compra! A árvore é fácil de montar, ocupa pouco espaço quando desmontada e fica linda quando está iluminada.", mediaUrl: "https://down-zl-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfkp-m37o2e50agc8be.16000051732960213.mp4", mediaType: "video" },
  { name: "Fernanda L.", city: "Porto Alegre, RS", text: "Produto de ótima apresentação. Os detalhes do Papai Noel, sinos e bengalas deixam a decoração muito especial.", mediaUrl: "https://down-bs-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6v7p0-mtmis978dyirae.16000051790519692.mp4", mediaType: "video" },
  { name: "Aline F.", city: "Fortaleza, CE", text: "Fiquei surpresa com a qualidade. A estrutura ficou firme depois de montada e a iluminação funciona perfeitamente.", mediaUrl: "https://down-zl-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfkr-m2p4iudjpslvc3.16000051731837731.mp4", mediaType: "video" },
  { name: "Mariana T.", city: "Campinas, SP", text: "Chegou tudo certinho, sem peças faltando e muito bem protegido. Valeu muito a pena!", mediaUrl: "https://down-zl-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfko-m2q2jvp4rtolbe.16000051731894961.mp4", mediaType: "video" },
  { name: "Renata A.", city: "Salvador, BA", text: "Uma decoração maravilhosa para o Natal! Ficou linda na minha sala e chamou a atenção de toda a família.", mediaUrl: "https://down-ws-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6kfkp-m1vlx7eo4lhtf9.16000051730050966.mp4", mediaType: "video" },
  { name: "Débora C.", city: "Recife, PE", text: "Gostei bastante da praticidade. É dobrável, fácil de guardar e muito bonita depois de montada.", mediaUrl: "https://down-zl-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6v7ox-mv7kqgpaeccjbf.16000051793973338.mp4", mediaType: "video" },
  { name: "Tatiane B.", city: "Goiânia, GO", text: "Excelente aquisição! Os detalhes dourados combinam muito bem com a iluminação e deixam o ambiente elegante.", mediaUrl: "https://down-br.img.susercontent.com/file/br-11134103-820lh-mvcdairltbeqcd.webp", mediaType: "image" },
  { name: "Simone V.", city: "Rio de Janeiro, RJ", text: "Compra muito satisfatória. Produto bonito, prático e com ótimo visual. Recomendo para quem quer uma decoração natalina diferente.", mediaUrl: "https://down-bs-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6v7oy-mvejtpao80e992.16000051794395547.mp4", mediaType: "video" },
];

export function findAddon(slug: string): LedItem | undefined {
  return ALL_ADDONS.find((a) => a.slug === slug);
}
