import type { Metadata } from "next";
import { db } from "@/lib/db";
import { isAtacadoAdmin } from "@/lib/atacado-admin";
import { CAMPAIGN } from "@/lib/atacado";
import LeadsLogin from "./LeadsLogin";
import LeadsAdminClient, { type AdminLead, type AdminLeadItem } from "./LeadsAdminClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Leads · Atacado Panetone",
  robots: { index: false, follow: false },
};

export default async function AtacadoAdminPage() {
  if (!isAtacadoAdmin()) {
    return <LeadsLogin />;
  }

  const rows = await db.atacadoLead.findMany({
    where: { campaign: CAMPAIGN },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const leads: AdminLead[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    name: r.name,
    phone: r.phone,
    email: r.email,
    buyerType: r.buyerType,
    company: r.company,
    city: r.city,
    items: Array.isArray(r.items) ? (r.items as unknown as AdminLeadItem[]) : [],
    totalCents: r.totalCents,
    sinalCents: r.sinalCents,
    totalPieces: r.totalPieces,
    message: r.message,
    status: r.status,
    adminNote: r.adminNote,
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    utmCampaign: r.utmCampaign,
  }));

  return <LeadsAdminClient initialLeads={leads} />;
}
