import { NextResponse } from "next/server";
import { checkPassword, setAtacadoCookie } from "@/lib/atacado-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "senha_incorreta" }, { status: 401 });
  }

  setAtacadoCookie();
  return NextResponse.json({ ok: true });
}
