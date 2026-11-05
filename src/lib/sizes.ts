import { db } from "@/lib/db";

/**
 * Tamanhos da árvore = produtos MAIN. O rótulo do tamanho (ex.: "1,80 m") fica no campo shortPitch
 * e é editado em Admin > Produtos; tudo no site (seletor, checkout, FAQ, upgrade) lê daqui.
 */
export const sizeName = (label: string) => `Árvore de Natal Montada ${label}`;

export const sizeLabel = (p: { shortPitch: string | null; name: string }) => p.shortPitch?.trim() || p.name;

/** Tamanhos ativos, do menor para o maior (ordem do admin). */
export function getSizes() {
  return db.product.findMany({
    where: { type: "MAIN", active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Troca {maior} e {atual} nos textos das ofertas pelo tamanho real. */
export function fillSizeTokens(text: string, tokens: { maior?: string | null; atual?: string | null }) {
  return text.replace(/\{maior\}/g, tokens.maior ?? "maior tamanho").replace(/\{atual\}/g, tokens.atual ?? "sua árvore");
}
