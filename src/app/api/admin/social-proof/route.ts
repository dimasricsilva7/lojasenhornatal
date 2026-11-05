import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { mediaTypeFromUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().trim().url().max(1000),
  mediaType: z.enum(["image", "video"]).optional(),
  caption: z.string().trim().max(200).optional().default(""),
  name: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
});

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;
  const items = await db.socialProof.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Link inválido" }, { status: 422 });
  const d = parsed.data;
  const last = await db.socialProof.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const item = await db.socialProof.create({
    data: {
      url: d.url,
      mediaType: d.mediaType ?? mediaTypeFromUrl(d.url),
      caption: d.caption || null,
      name: d.name || null,
      city: d.city || null,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(item);
}
