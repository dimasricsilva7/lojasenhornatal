import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10_000; // batimento a cada 5 s → online = visto nos últimos 10 s

function pageLabel(raw: string | null, section: string | null) {
  const path = raw?.split("?")[0] ?? null;
  // Na página da árvore, mostra a seção em que o visitante está (hero, vídeo, produtos…).
  if (!path || path === "/") return section?.trim() || "Topo (Hero)";
  if (path === "/checkout") return "Checkout";
  if (path.startsWith("/upsell")) return "Oferta pós-compra";
  if (path.startsWith("/pedido/sucesso")) return "Compra concluída";
  if (path.startsWith("/politicas/")) return "Políticas";
  return path;
}

const DEVICE_LABEL: Record<string, string> = { mobile: "Celular", desktop: "Computador", tablet: "Tablet" };

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const now = Date.now();
  // "Hoje" no fuso de Brasília (UTC-3).
  const todayStart = new Date(new Date(now - 3 * 3600_000).toISOString().slice(0, 10) + "T03:00:00.000Z");
  const [sessions, today] = await Promise.all([
    db.visitor.findMany({ where: { lastSeenAt: { gte: new Date(now - WINDOW_MS) } }, orderBy: { lastSeenAt: "desc" }, take: 500 }),
    db.visitor.count({ where: { firstSeenAt: { gte: todayStart } } }),
  ]);

  type S = (typeof sessions)[number];
  const count = (key: (s: S) => string) => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(key(s), (m.get(key(s)) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }));
  };

  return NextResponse.json(
    {
      online: sessions.length,
      todaySessions: today,
      inCheckout: sessions.filter((s) => s.path?.startsWith("/checkout")).length,
      pages: count((s) => pageLabel(s.path, s.section)).slice(0, 8),
      sources: count((s) => s.source ?? "Direto"),
      devices: count((s) => DEVICE_LABEL[s.device ?? ""] ?? "Outro"),
      visitors: sessions.slice(0, 50).map((s) => ({
        id: s.id.slice(0, 6),
        page: pageLabel(s.path, s.section),
        source: s.source ?? "Direto",
        campaign: s.campaign,
        device: DEVICE_LABEL[s.device ?? ""] ?? "Outro",
        pageViews: s.pageViews,
        minutes: Math.max(0, Math.round((now - s.firstSeenAt.getTime()) / 60_000)),
      })),
      at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
