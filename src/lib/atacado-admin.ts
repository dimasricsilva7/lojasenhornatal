/**
 * Autenticação do painel de leads do ATACADO — totalmente independente do
 * admin da loja. Gate simples por senha única, cookie httpOnly próprio.
 * A senha padrão é @Senha2026! e pode ser trocada pela env LEADS_ADMIN_PASSWORD.
 */
import crypto from "crypto";
import { cookies } from "next/headers";

export const ATACADO_ADMIN_COOKIE = "atacado_leads_admin";
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

export function atacadoPassword(): string {
  return process.env.LEADS_ADMIN_PASSWORD?.trim() || "@Senha2026!";
}

/** Token determinístico guardado no cookie (não é a senha em texto puro). */
export function atacadoToken(): string {
  const secret = process.env.AUTH_SECRET?.trim() || "senhor-natal-atacado-fallback-secret";
  return crypto.createHash("sha256").update(`atacado::${atacadoPassword()}::${secret}`).digest("hex");
}

/** Comparação resistente a timing. */
export function checkPassword(input: string): boolean {
  const a = Buffer.from(input ?? "");
  const b = Buffer.from(atacadoPassword());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAtacadoAdmin(): boolean {
  const c = cookies().get(ATACADO_ADMIN_COOKIE)?.value;
  if (!c) return false;
  const expected = atacadoToken();
  if (c.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(c), Buffer.from(expected));
}

export function setAtacadoCookie() {
  cookies().set(ATACADO_ADMIN_COOKIE, atacadoToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + TTL_MS),
  });
}

export function clearAtacadoCookie() {
  cookies().delete(ATACADO_ADMIN_COOKIE);
}
