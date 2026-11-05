import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  caption: z.string().trim().max(200).optional(),
  name: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  mediaType: z.enum(["image", "video"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  const item = await db.socialProof.update({ where: { id: params.id }, data: parsed.data }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;
  await db.socialProof.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
