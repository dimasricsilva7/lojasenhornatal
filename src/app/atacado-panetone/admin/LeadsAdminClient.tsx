"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Search,
  Download,
  LogOut,
  RefreshCw,
  Trash2,
  ChevronDown,
  Users,
  Flame,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { formatBRL, formatInt, buyerLabel, LEAD_STATUSES, statusMeta } from "@/lib/atacado";

export type AdminLeadItem = {
  id: string;
  name: string;
  qty: number;
  unitCents: number;
  totalCents: number;
  unit: string;
  boxSize: number | null;
};

export type AdminLead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string | null;
  buyerType: string;
  company: string | null;
  city: string | null;
  items: AdminLeadItem[];
  totalCents: number;
  sinalCents: number;
  totalPieces: number;
  message: string | null;
  status: string;
  adminNote: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

function waLink(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length <= 11 && !d.startsWith("55")) d = "55" + d;
  return `https://wa.me/${d}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: string }) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-graphite-500">{label}</p>
        <p className="text-lg font-extrabold text-graphite-950">{value}</p>
      </div>
    </div>
  );
}

export default function LeadsAdminClient({ initialLeads }: { initialLeads: AdminLead[] }) {
  const [leads, setLeads] = useState<AdminLead[]>(initialLeads);
  const [filter, setFilter] = useState<string>("TODOS");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "TODOS" && l.status !== filter) return false;
      if (!s) return true;
      return (
        l.name.toLowerCase().includes(s) ||
        l.phone.includes(s) ||
        (l.company ?? "").toLowerCase().includes(s) ||
        (l.city ?? "").toLowerCase().includes(s)
      );
    });
  }, [leads, filter, search]);

  const stats = useMemo(() => {
    const novos = leads.filter((l) => l.status === "NOVO").length;
    const fechados = leads.filter((l) => l.status === "FECHADO").length;
    const pipeline = leads
      .filter((l) => !["PERDIDO"].includes(l.status))
      .reduce((a, l) => a + l.totalCents, 0);
    const fechado = leads.filter((l) => l.status === "FECHADO").reduce((a, l) => a + l.totalCents, 0);
    return { total: leads.length, novos, fechados, pipeline, fechado };
  }, [leads]);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`/api/atacado/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este lead? Não dá pra desfazer.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/atacado/admin/leads/${id}`, { method: "DELETE" });
      if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/atacado/admin/logout", { method: "POST" });
    window.location.reload();
  }

  function exportCsv() {
    const head = [
      "Data",
      "Nome",
      "Telefone",
      "Email",
      "Tipo",
      "Empresa",
      "Cidade",
      "Itens",
      "Unidades",
      "Total",
      "Sinal",
      "Status",
      "UTM Source",
      "UTM Campaign",
      "Observacao",
    ];
    const rows = filtered.map((l) => [
      fmtDate(l.createdAt),
      l.name,
      l.phone,
      l.email ?? "",
      buyerLabel(l.buyerType),
      l.company ?? "",
      l.city ?? "",
      l.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
      String(l.totalPieces),
      formatBRL(l.totalCents),
      formatBRL(l.sinalCents),
      statusMeta(l.status).label,
      l.utmSource ?? "",
      l.utmCampaign ?? "",
      (l.message ?? "").replace(/\n/g, " "),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-atacado-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-cream-50 pb-16">
      {/* Topo */}
      <header className="sticky top-0 z-20 border-b border-graphite-900/10 bg-white/90 backdrop-blur">
        <div className="container-app flex items-center justify-between py-3">
          <h1 className="text-lg font-extrabold text-graphite-950">
            Leads · <span className="text-clay-600">Atacado Panetone</span>
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="btn-secondary !px-3 !py-2 text-xs">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </button>
            <button onClick={logout} className="btn-secondary !px-3 !py-2 text-xs">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-app pt-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Total de leads" value={formatInt(stats.total)} tone="bg-sage-100 text-sage-700" />
          <StatCard icon={Flame} label="Novos" value={formatInt(stats.novos)} tone="bg-clay-100 text-clay-600" />
          <StatCard icon={CheckCircle2} label="Fechados" value={formatInt(stats.fechados)} tone="bg-sage-500 text-white" />
          <StatCard icon={DollarSign} label="Pipeline (estimado)" value={formatBRL(stats.pipeline)} tone="bg-graphite-900 text-white" />
        </div>

        {/* Filtros */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, empresa..."
              className="w-full rounded-full border border-graphite-900/15 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sage-500"
            />
          </div>
          <button onClick={exportCsv} className="btn-secondary !py-2.5 text-xs">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {["TODOS", ...LEAD_STATUSES.map((s) => s.value)].map((st) => {
            const active = filter === st;
            const label = st === "TODOS" ? "Todos" : statusMeta(st).label;
            const count = st === "TODOS" ? leads.length : leads.filter((l) => l.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-graphite-950 text-white" : "bg-white text-graphite-600 ring-1 ring-graphite-900/10 hover:bg-cream-100"
                }`}
              >
                {label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="mt-5 space-y-2">
          {filtered.length === 0 && (
            <div className="card-surface p-10 text-center text-graphite-500">Nenhum lead por aqui ainda.</div>
          )}

          {filtered.map((l) => {
            const sm = statusMeta(l.status);
            const isOpen = open === l.id;
            return (
              <div key={l.id} className="card-surface overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    onClick={() => setOpen(isOpen ? null : l.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 text-graphite-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-graphite-950">
                        {l.name}
                        {l.company ? <span className="font-normal text-graphite-500"> · {l.company}</span> : ""}
                      </p>
                      <p className="truncate text-xs text-graphite-500">
                        {fmtDate(l.createdAt)} · {buyerLabel(l.buyerType)}
                        {l.city ? ` · ${l.city}` : ""}
                      </p>
                    </div>
                  </button>

                  <div className="text-right">
                    <p className="font-extrabold text-graphite-950">{formatBRL(l.totalCents)}</p>
                    <p className="text-[11px] text-graphite-500">sinal {formatBRL(l.sinalCents)}</p>
                  </div>

                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${sm.tone}`}>{sm.label}</span>

                  <a
                    href={waLink(l.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sage-600 text-white transition-transform hover:scale-105"
                    title="Abrir WhatsApp do lead"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>

                {isOpen && (
                  <div className="border-t border-graphite-900/10 bg-cream-25 px-4 py-4 text-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-graphite-500">Contato</p>
                        <p className="text-graphite-800">📞 {l.phone}</p>
                        {l.email && <p className="text-graphite-800">✉️ {l.email}</p>}
                        {(l.utmSource || l.utmCampaign) && (
                          <p className="mt-1 text-xs text-graphite-500">
                            Origem: {l.utmSource ?? "—"} / {l.utmCampaign ?? "—"}
                          </p>
                        )}
                        {l.message && (
                          <p className="mt-2 rounded-lg bg-white p-2 text-graphite-700 ring-1 ring-graphite-900/5">
                            📝 {l.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-graphite-500">
                          Itens ({formatInt(l.totalPieces)} panetones)
                        </p>
                        <ul className="space-y-1">
                          {l.items.map((i, idx) => (
                            <li key={idx} className="flex justify-between gap-2 text-graphite-800">
                              <span>
                                {i.qty}× {i.name}
                              </span>
                              <span className="font-semibold">{formatBRL(i.totalCents)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-graphite-500">Status:</span>
                      <select
                        value={l.status}
                        disabled={busy === l.id}
                        onChange={(e) => updateStatus(l.id, e.target.value)}
                        className="rounded-lg border border-graphite-900/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-sage-500"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => remove(l.id)}
                        disabled={busy === l.id}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-clay-600 hover:bg-clay-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
