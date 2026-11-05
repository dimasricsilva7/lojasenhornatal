import { PrismaClient, ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DESC =
  "Árvore de Natal verde tradicional que vem achatada na caixa, já decorada e com pisca-pisca instalado. Encaixe o mastro, puxe para cima e ligue na tomada. Bivolt, com enfeites inclusos (a partir de 50, conforme o tamanho).";

type Seed = {
  slug: string;
  name: string;
  type: ProductType;
  priceCents: number;
  sortOrder: number;
  shortPitch?: string;
  featured?: boolean;
  description?: string;
  orderBumpEnabled?: boolean;
  orderBumpHeadline?: string;
  upsellEnabled?: boolean;
  upsellHeadline?: string;
  forceType?: boolean; // produto que já existia com outro tipo: corrige o tipo sem mexer no resto
};

const PRODUCTS: Seed[] = [
  // Tamanhos (MAIN), do menor para o maior. shortPitch = rótulo do tamanho (editável no admin).
  // Os slugs são só identificadores internos; o tamanho exibido vem sempre do rótulo.
  { slug: "arvore-120", name: "Árvore de Natal Montada 1,50 m", type: "MAIN", priceCents: 6700, sortOrder: 0, shortPitch: "1,50 m", description: DESC },
  { slug: "arvore-200", name: "Árvore de Natal Montada 1,80 m", type: "MAIN", priceCents: 9700, sortOrder: 1, shortPitch: "1,80 m", featured: true, description: DESC },
  { slug: "arvore-220", name: "Árvore de Natal Montada 2,20 m", type: "MAIN", priceCents: 11700, sortOrder: 2, shortPitch: "2,20 m", description: DESC },

  // Order bumps: todos ativos e exibidos no checkout (liga/desliga em Admin > Produtos).
  { slug: "pisca-cascata-branco", name: "Pisca-pisca Cascata Branco", type: "ORDER_BUMP", priceCents: 2990, sortOrder: 0, featured: true, orderBumpEnabled: true, orderBumpHeadline: "Leve também o pisca-pisca cascata branco para a janela ou a parede da sala." },
  { slug: "kit-20-bolas-premium", name: "Kit 20 Bolas de Natal Premium", type: "ORDER_BUMP", priceCents: 2490, sortOrder: 1, orderBumpEnabled: true, orderBumpHeadline: "Quer a árvore ainda mais cheia? Adicione 20 bolas de Natal premium." },
  { slug: "kit-mesa-posta-6", name: "Kit Natalino Mesa Posta (6 unidades)", type: "ORDER_BUMP", priceCents: 1990, sortOrder: 2, orderBumpEnabled: true, orderBumpHeadline: "Complete a ceia com o kit natalino de mesa posta (6 unidades)." },
  { slug: "saia-arvore-70cm", name: "Saia Decorativa para Árvore de Natal 70 cm", type: "ORDER_BUMP", priceCents: 2990, sortOrder: 3, orderBumpEnabled: true, orderBumpHeadline: "Esconda a base com a saia decorativa de 70 cm." },
  { slug: "caixas-presente-decorativas", name: "Kit de Caixas de Presente Decorativas", type: "ORDER_BUMP", priceCents: 3990, sortOrder: 4, orderBumpEnabled: true, orderBumpHeadline: "Monte o cenário completo com caixas de presente decorativas aos pés da árvore." },
  { slug: "pisca-branco-3m", name: "Pisca-pisca Branco 3 m", type: "ORDER_BUMP", priceCents: 3490, sortOrder: 5, orderBumpEnabled: true, orderBumpHeadline: "Mais luz: adicione um pisca-pisca branco de 3 m." },

  // Upsells: TODOS os ativos são mostrados em sequência, na ordem; depois vêm os downsells.
  { slug: "kit-natal-completo-premium", name: "Kit Natal Completo Premium", type: "UPSELL", priceCents: 6700, sortOrder: 0, upsellEnabled: true, upsellHeadline: "Antes de fechar: complete a decoração com o Kit Natal Completo Premium. Ele vai junto no mesmo envio." },
  { slug: "kit-decoracao-luxo", name: "Kit Decoração Natalina Luxo", type: "UPSELL", priceCents: 4700, sortOrder: 1, upsellEnabled: true, upsellHeadline: "Leve também o Kit Decoração Natalina Luxo no mesmo envio." },
  // Upgrade para o MAIOR tamanho; não aparece para quem já comprou o maior. {maior}/{atual} viram os tamanhos reais.
  { slug: "upgrade-arvore-maior", name: "Upgrade para a árvore de {maior}", type: "UPSELL", priceCents: 6700, sortOrder: 2, upsellEnabled: true, upsellHeadline: "Que tal uma árvore maior? Troque a sua de {atual} pela de {maior}. Ela vai no lugar da sua, no mesmo envio." },

  // Downsells: mostrados em sequência depois dos upsells.
  { slug: "kit-essencial-enfeites", name: "Kit Essencial de Enfeites", type: "DOWNSELL", priceCents: 2990, sortOrder: 0, upsellEnabled: true, forceType: true, upsellHeadline: "Que tal o Kit Essencial de Enfeites, por um valor menor, no mesmo envio?" },
  { slug: "pisca-led-especial", name: "Pisca-pisca LED Especial", type: "DOWNSELL", priceCents: 1990, sortOrder: 1, upsellEnabled: true, forceType: true, upsellHeadline: "Última chance: leve o Pisca-pisca LED Especial no mesmo envio, com valor especial." },
];

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.admin.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: { email: adminEmail, passwordHash, name: "Administrador" },
    });
    console.log(`Admin garantido: ${adminEmail}`);
  } else {
    console.warn("ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD ausentes — nenhum admin criado.");
  }

  for (const p of PRODUCTS) {
    // update: {} — rodar o seed de novo nunca sobrescreve o que foi editado no admin.
    await db.product.upsert({
      where: { slug: p.slug },
      update: p.forceType ? { type: p.type } : {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description ?? null,
        shortPitch: p.shortPitch ?? null,
        priceCents: p.priceCents,
        images: [], // fotos são enviadas pelo painel /admin/produtos
        type: p.type,
        active: true,
        featured: p.featured ?? false,
        sortOrder: p.sortOrder,
        bravopayProductId: p.type === "MAIN" ? process.env.BRAVOPAY_PRODUCT_ID ?? null : null,
        orderBumpEnabled: p.orderBumpEnabled ?? false,
        orderBumpPriceCents: p.type === "ORDER_BUMP" ? p.priceCents : null,
        orderBumpHeadline: p.orderBumpHeadline ?? null,
        upsellEnabled: p.upsellEnabled ?? false,
        upsellPriceCents: p.type === "UPSELL" || p.type === "DOWNSELL" ? p.priceCents : null,
        upsellHeadline: p.upsellHeadline ?? null,
      },
    });
  }
  console.log(`Seed concluído: ${PRODUCTS.length} produtos.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
