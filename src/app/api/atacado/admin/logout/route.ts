import { NextResponse } from "next/server";
import { clearAtacadoCookie } from "@/lib/atacado-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  clearAtacadoCookie();
  return NextResponse.json({ ok: true });
}
