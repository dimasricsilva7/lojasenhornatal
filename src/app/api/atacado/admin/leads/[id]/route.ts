import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAtacadoAdmin } from "@/lib/atacado-admin";
import { LEAD_STATUSES } from "@/lib/atacado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusValues = LEAD_STATUSES.map((s) => s.value) as [string, ...string[]];

const patchSchema = z.object({
  status: z.enum(statusValues).optional(),
  adminNote: z.string().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAtacadoAdmin()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "dados_invalidos" }, { status: 400 });
  }

  try {
    await db.atacadoLead.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.adminNote !== undefined ? { adminNote: parsed.data.adminNote } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[atacado/admin/leads] erro ao atualizar", err);
    return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAtacadoAdmin()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await db.atacadoLead.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
  }
}
