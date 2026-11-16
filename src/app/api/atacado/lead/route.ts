import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeQuote, CAMPAIGN } from "@/lib/atacado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "nome").max(120),
  phone: z.string().trim().min(8, "telefone").max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  buyerType: z.enum(["empresa", "doacao", "revenda", "pessoal"]).default("empresa"),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  quantities: z.record(z.string(), z.number()).default({}),
  attribution: z
    .object({
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      utmContent: z.string().max(200).optional(),
      utmTerm: z.string().max(200).optional(),
      fbclid: z.string().max(400).optional(),
    })
    .partial()
    .optional(),
  path: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "dados_invalidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Recalcula SEMPRE no servidor — nunca confia no total do cliente.
  const quote = computeQuote(d.quantities);
  if (!quote.hasItems) {
    return NextResponse.json({ error: "orcamento_vazio" }, { status: 400 });
  }

  const items = quote.lines.map((l) => ({
    id: l.id,
    name: l.name,
    group: l.group,
    unit: l.unit,
    boxSize: l.boxSize ?? null,
    qty: l.qty,
    unitCents: l.unitCents,
    totalCents: l.totalCents,
  }));

  try {
    const lead = await db.atacadoLead.create({
      data: {
        campaign: CAMPAIGN,
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        buyerType: d.buyerType,
        company: d.company || null,
        city: d.city || null,
        items,
        totalCents: quote.totalCents,
        sinalCents: quote.sinalCents,
        totalPieces: quote.totalPieces,
        message: d.message || null,
        utmSource: d.attribution?.utmSource || null,
        utmMedium: d.attribution?.utmMedium || null,
        utmCampaign: d.attribution?.utmCampaign || null,
        utmContent: d.attribution?.utmContent || null,
        utmTerm: d.attribution?.utmTerm || null,
        fbclid: d.attribution?.fbclid || null,
        path: d.path || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err) {
    console.error("[atacado/lead] erro ao salvar", err);
    return NextResponse.json({ error: "erro_interno" }, { status: 500 });
  }
}
