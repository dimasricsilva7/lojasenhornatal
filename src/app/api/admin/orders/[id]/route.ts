import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { markOrderPaidGeneric } from "@/lib/order-status";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { customer: true, items: true, payments: true, trackingEvents: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(order);
}

const patchSchema = z.object({ action: z.enum(["cancel", "mark_paid"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 422 });

  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Baixa manual (PIX manual, ou qualquer pedido que o lojista confirmou por fora).
  // Dispara os mesmos efeitos de um pagamento normal: Meta, Translog, upsell liberado.
  if (parsed.data.action === "mark_paid") {
    if (order.status === "PAID") return NextResponse.json(order);
    const paid = await markOrderPaidGeneric(order.id, {
      providerTxId: `manual_${order.displayId}`,
      amountCents: order.totalCents,
      method: "pix_manual",
    });
    return NextResponse.json(paid ?? order);
  }

  if (order.status === "PAID") {
    return NextResponse.json({ error: "Não é possível cancelar um pedido já pago" }, { status: 400 });
  }

  const updated = await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.status === "PAID") {
    return NextResponse.json({ error: "Não é possível excluir um pedido já pago" }, { status: 400 });
  }

  await db.order.delete({ where: { id: order.id } });
  return NextResponse.json({ ok: true });
}
