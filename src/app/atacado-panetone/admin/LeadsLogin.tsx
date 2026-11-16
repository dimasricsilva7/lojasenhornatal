"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function LeadsLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/atacado/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setError("Senha incorreta.");
      }
    } catch {
      setError("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-lift">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-graphite-950">Leads · Atacado Panetone</h1>
          <p className="text-sm text-graphite-500">Área restrita</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          className="w-full rounded-lg border border-graphite-900/15 bg-white px-3 py-3 text-sm outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
        />
        {error && <p className="mt-2 text-xs font-semibold text-clay-600">{error}</p>}
        <button type="submit" disabled={loading || !password} className="btn-primary mt-4 w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
        </button>
      </form>
    </main>
  );
}
