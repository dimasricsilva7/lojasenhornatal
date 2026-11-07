import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncOrderFromBravopay } from "@/lib/order-status";
import { getTransaction } from "@/lib/bravopay";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest, { params }: { params: { displayId: string } }) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`status:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const order = await db.order.findUnique({ where: { displayId: params.displayId } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const synced = (await syncOrderFromBravopay(order)) ?? order;

  // DEBUG temporário: se ainda não há PIX, mostra o que o BravoPay responde (por id).
  let _debug: unknown = undefined;
  if (req.nextUrl.searchParams.get("debug") === "1" && !synced.pixCopyPaste && synced.bravopayTransactionId) {
    try {
      const tx = (await getTransaction(synced.bravopayTransactionId)) as unknown as Record<string, unknown> | null;
      _debug = tx
        ? { status: tx.status, pix_status: tx.pix_status, message: tx.message, pix: tx.pix ?? null }
        : "tx_not_found";
    } catch (e) {
      _debug = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    orderId: synced.displayId,
    status: synced.status,
    totalCents: synced.totalCents,
    pixCopyPaste: synced.pixCopyPaste,
    pixExpiresAt: synced.pixExpiresAt,
    ...(_debug !== undefined ? { _debug } : {}),
  });
}
