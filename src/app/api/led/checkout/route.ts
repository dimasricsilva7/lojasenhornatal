import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createPixTransaction, getTransaction, BravopayError } from "@/lib/bravopay";
import { generateDisplayId } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { CAMPAIGN, MAIN, ALL_ADDONS, findAddon } from "@/lib/led/config";

export const dynamic = "force-dynamic";

const schema = z.object({
  idempotencyKey: z.string().uuid(),
  addonSlugs: z.array(z.string()).default([]),
  customer: z.object({
    name: z.string().trim().min(3).max(150),
    email: z.string().trim().email().max(200),
    cpf: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 11, "CPF inválido"),
    phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  }),
  shipping: z.object({
    zip: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 8, "CEP inválido"),
    address: z.string().trim().min(2).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(100).optional().default(""),
    neighborhood: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().length(2),
  }),
  utm: z.object({
    utmSource: z.string().optional(), utmMedium: z.string().optional(), utmCampaign: z.string().optional(),
    utmContent: z.string().optional(), utmTerm: z.string().optional(),
    fbclid: z.string().optional(), gclid: z.string().optional(), ttclid: z.string().optional(),
  }).partial().optional(),
  eventId: z.string().optional(),
});

function resp(o: { displayId: string; status: string; totalCents: number; pixCopyPaste: string | null; pixExpiresAt: Date | null }) {
  return { orderId: o.displayId, status: o.status, totalCents: o.totalCents, pixCopyPaste: o.pixCopyPaste, pixExpiresAt: o.pixExpiresAt };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`led-checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  const input = parsed.data;

  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return NextResponse.json(resp(existing));

  // Monta o carrinho a partir da config (preços fixos e confiáveis no servidor).
  const addonSlugs = [...new Set(input.addonSlugs)].filter((s) => findAddon(s));
  const slugs = [MAIN.slug, ...addonSlugs];
  const products = await db.product.findMany({ where: { campaign: CAMPAIGN, slug: { in: slugs } } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const mainProduct = bySlug.get(MAIN.slug);
  if (!mainProduct) return NextResponse.json({ error: "Produto indisponível (rode o seed)." }, { status: 400 });

  const items = [
    { productId: mainProduct.id, name: MAIN.name, kind: "main", quantity: 1, unitPriceCents: MAIN.priceCents, totalCents: MAIN.priceCents },
    ...addonSlugs.map((s) => {
      const cfg = findAddon(s)!;
      const prod = bySlug.get(s);
      return prod ? { productId: prod.id, name: cfg.name, kind: "order_bump", quantity: 1, unitPriceCents: cfg.priceCents, totalCents: cfg.priceCents } : null;
    }).filter(Boolean) as { productId: string; name: string; kind: string; quantity: number; unitPriceCents: number; totalCents: number }[],
  ];
  const totalCents = items.reduce((s, i) => s + i.totalCents, 0);

  const customer = await db.customer.upsert({
    where: { email: input.customer.email },
    update: { name: input.customer.name, phone: input.customer.phone, cpf: input.customer.cpf },
    create: { name: input.customer.name, email: input.customer.email, phone: input.customer.phone, cpf: input.customer.cpf },
  });

  const displayId = generateDisplayId();
  let order;
  try {
    order = await db.order.create({
      data: {
        displayId, campaign: CAMPAIGN, customerId: customer.id, idempotencyKey: input.idempotencyKey, status: "CREATED",
        gateway: "bravopay",
        shippingZip: input.shipping.zip, shippingAddress: input.shipping.address, shippingNumber: input.shipping.number,
        shippingComplement: input.shipping.complement || null, shippingNeighborhood: input.shipping.neighborhood,
        shippingCity: input.shipping.city, shippingState: input.shipping.state.toUpperCase(),
        subtotalCents: totalCents, shippingCents: 0, discountCents: 0, totalCents,
        utmSource: input.utm?.utmSource, utmMedium: input.utm?.utmMedium, utmCampaign: input.utm?.utmCampaign,
        utmContent: input.utm?.utmContent, utmTerm: input.utm?.utmTerm,
        fbclid: input.utm?.fbclid, gclid: input.utm?.gclid, ttclid: input.utm?.ttclid, metaEventId: input.eventId,
        items: { create: items },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const raced = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (raced) return NextResponse.json(resp(raced));
    }
    throw err;
  }

  await db.abandonedCart.create({
    data: { customerId: customer.id, customerName: customer.name, email: customer.email, phone: customer.phone, orderId: order.id, cartValueCents: totalCents, status: "OPEN" },
  });

  const productId = mainProduct.bravopayProductId || process.env.BRAVOPAY_PRODUCT_ID || undefined;
  try {
    const tx = await createPixTransaction({
      amountCents: totalCents,
      idempotencyKey: input.idempotencyKey,
      externalReference: order.displayId,
      description: `${MAIN.name} · Pedido ${order.displayId}`,
      productId,
      customer: { name: customer.name, email: customer.email, cpf: customer.cpf, phone: customer.phone },
      utm: { source: input.utm?.utmSource, medium: input.utm?.utmMedium, campaign: input.utm?.utmCampaign, content: input.utm?.utmContent, term: input.utm?.utmTerm, fbclid: input.utm?.fbclid, gclid: input.utm?.gclid, ttclid: input.utm?.ttclid },
    });
    // BravoPay gera o copy_paste em ~5-30s; tenta uma leitura imediata, senão o polling do cliente pega.
    let pix = tx.pix?.copy_paste ?? null;
    let pixExp = tx.pix?.expires_at ? new Date(tx.pix.expires_at) : null;
    if (!pix && tx.id) {
      const again = await getTransaction(tx.id).catch(() => null);
      if (again?.pix?.copy_paste) { pix = again.pix.copy_paste; pixExp = again.pix.expires_at ? new Date(again.pix.expires_at) : null; }
    }
    order = await db.order.update({
      where: { id: order.id },
      data: { status: "PIX_GENERATED", bravopayTransactionId: tx.id, pixCopyPaste: pix, pixExpiresAt: pixExp },
    });
    await db.trackingEvent.create({ data: { orderId: order.id, eventName: "pix_generated", metadata: { campaign: CAMPAIGN } } });
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } }).catch(() => {});
    const message = err instanceof BravopayError ? err.message : "Falha ao gerar o PIX";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json(resp(order));
}
