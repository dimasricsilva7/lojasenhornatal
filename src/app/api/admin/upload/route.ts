import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin-guard";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Upload de imagem do admin (fotos de produto). Devolve a URL pública no Vercel Blob. */
export async function POST(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WEBP ou GIF." }, { status: 422 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande (máx. 8MB)." }, { status: 422 });

  const extension = file.type.split("/")[1];
  const blob = await put(`produtos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
