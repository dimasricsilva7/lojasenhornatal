import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { priceCheckout } from "@/lib/pricing";
import { generateOrderPayment, resolveGateway, GatewayError } from "@/lib/checkout-gateway";
import { getSettings } from "@/lib/settings";
import { generateDisplayId } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  mainProductSlug: z.string().min(1),
  orderBumpProductIds: z.array(z.string()).default([]),
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
  utm: z
    .object({
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmContent: z.string().optional(),
      utmTerm: z.string().optional(),
      fbclid: z.string().optional(),
      gclid: z.string().optional(),
      ttclid: z.string().optional(),
    })
    .partial()
    .optional(),
  eventId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante e tente novamente." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;

  // Reidratação idempotente: se este idempotencyKey já gerou um pedido
  // (duplo clique, retry de rede, refresh), devolve o pedido existente
  // em vez de criar um novo ou cobrar duas vezes.
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    return NextResponse.json(toResponse(existing));
  }

  let quote;
  try {
    quote = await priceCheckout({
      mainProductSlug: input.mainProductSlug,
      orderBumpProductIds: input.orderBumpProductIds,
    });
  } catch {
    return NextResponse.json({ error: "Produto indisponível" }, { status: 400 });
  }

  const bravopayProduct = await db.product.findFirst({ where: { type: "MAIN" } });
  // product_id da BravoPay é opcional: só é enviado se configurado.
  const productId = bravopayProduct?.bravopayProductId || process.env.BRAVOPAY_PRODUCT_ID || undefined;

  const customer = await db.customer.upsert({
    where: { email: input.customer.email },
    update: { name: input.customer.name, phone: input.customer.phone, cpf: input.customer.cpf },
    create: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      cpf: input.customer.cpf,
    },
  });

  const displayId = generateDisplayId();

  let order;
  try {
    order = await db.order.create({
      data: {
        displayId,
        customerId: customer.id,
        idempotencyKey: input.idempotencyKey,
        status: "CREATED",
        shippingZip: input.shipping.zip,
        shippingAddress: input.shipping.address,
        shippingNumber: input.shipping.number,
        shippingComplement: input.shipping.complement || null,
        shippingNeighborhood: input.shipping.neighborhood,
        shippingCity: input.shipping.city,
        shippingState: input.shipping.state.toUpperCase(),
        subtotalCents: quote.subtotalCents,
        shippingCents: quote.shippingCents,
        discountCents: quote.discountCents,
        totalCents: quote.totalCents,
        utmSource: input.utm?.utmSource,
        utmMedium: input.utm?.utmMedium,
        utmCampaign: input.utm?.utmCampaign,
        utmContent: input.utm?.utmContent,
        utmTerm: input.utm?.utmTerm,
        fbclid: input.utm?.fbclid,
        gclid: input.utm?.gclid,
        ttclid: input.utm?.ttclid,
        metaEventId: input.eventId,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            kind: item.kind,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents: item.totalCents,
          })),
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // corrida entre duas requisições simultâneas com a mesma idempotencyKey
      const raced = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (raced) return NextResponse.json(toResponse(raced));
    }
    throw err;
  }

  await db.abandonedCart.create({
    data: {
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      orderId: order.id,
      cartValueCents: order.totalCents,
      status: "OPEN",
    },
  });

  const settings = await getSettings();
  const gateway = resolveGateway(settings.payment_gateway);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Meio de cobrança compartilhado (ver lib/checkout-gateway): o gateway escolhido
  // no admin vale para todos os produtos.
  try {
    order = await generateOrderPayment({ ...order, customer }, gateway, {
      settings,
      siteUrl,
      description: quote.items[0]?.name ?? "Árvore de Natal Montada",
      productId,
      metadata: { orderId: order.id, displayId: order.displayId },
      utm: {
        source: input.utm?.utmSource,
        medium: input.utm?.utmMedium,
        campaign: input.utm?.utmCampaign,
        content: input.utm?.utmContent,
        term: input.utm?.utmTerm,
        fbclid: input.utm?.fbclid,
        gclid: input.utm?.gclid,
        ttclid: input.utm?.ttclid,
      },
    });
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: gateway === "infinitepay" ? "checkout_link_created" : "pix_generated" },
    });
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "purchase_failed", metadata: { reason: `${gateway}_error` } },
    });
    const message = err instanceof GatewayError ? err.message : "Falha ao gerar o PIX";
    return NextResponse.json({ error: message }, { status: err instanceof GatewayError ? err.status : 502 });
  }

  return NextResponse.json(toResponse(order));
}

function toResponse(order: {
  displayId: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  pixCopyPaste: string | null;
  pixExpiresAt: Date | null;
  checkoutUrl?: string | null;
}) {
  return {
    orderId: order.displayId,
    status: order.status,
    totalCents: order.totalCents,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    pixCopyPaste: order.pixCopyPaste,
    pixExpiresAt: order.pixExpiresAt,
    // InfinitePay: o cliente é redirecionado para esta URL hospedada (cartão+PIX).
    redirectUrl: order.checkoutUrl ?? null,
  };
}
