import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|vercel/i;

function deviceOf(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

/** Batimento das abas abertas do site (a cada 30 s com a aba visível + a cada troca de página). */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
  if (!rateLimit(`ping:${getClientIp(req.headers)}`, 30, 60_000)) return new NextResponse(null, { status: 204 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sid = clip(body?.sid, 64);
  if (!sid || !/^[A-Za-z0-9_-]{8,64}$/.test(sid)) return new NextResponse(null, { status: 204 });
  const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 300) : null;
  if (path?.startsWith("/admin")) return new NextResponse(null, { status: 204 });
  const nav = body?.nav === true;
  const now = new Date();

  await db.visitor
    .upsert({
      where: { id: sid },
      create: {
        id: sid,
        path,
        landingPage: path,
        device: deviceOf(ua),
        source: clip(body?.source, 60),
        campaign: clip(body?.campaign, 120),
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: { lastSeenAt: now, ...(path ? { path } : {}), ...(nav ? { pageViews: { increment: 1 } } : {}) },
    })
    .catch(() => null);

  return new NextResponse(null, { status: 204 });
}
