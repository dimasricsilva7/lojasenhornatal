-- Tamanhos: 1,20 m -> 1,50 m e 2,00 m -> 1,80 m (só se ainda estiverem com o valor antigo do seed).
UPDATE "Product" SET "shortPitch" = '1,50 m', "name" = 'Árvore de Natal Montada 1,50 m'
WHERE "slug" = 'arvore-120' AND "shortPitch" = '1,20 m';
UPDATE "Product" SET "shortPitch" = '1,80 m', "name" = 'Árvore de Natal Montada 1,80 m'
WHERE "slug" = 'arvore-200' AND "shortPitch" = '2,00 m';

-- Upgrade sempre para o maior tamanho, com o texto montado a partir dos tamanhos reais.
UPDATE "Product" SET "name" = 'Upgrade para a árvore de {maior}',
  "upsellHeadline" = 'Que tal uma árvore maior? Troque a sua de {atual} pela de {maior}. Ela vai no lugar da sua, no mesmo envio.'
WHERE "slug" = 'upgrade-arvore-maior' AND "name" = 'Upgrade para Árvore de Natal Maior';

-- Todas as ofertas pós-compra ativas.
UPDATE "Product" SET "upsellEnabled" = true
WHERE "slug" IN ('kit-natal-completo-premium', 'kit-decoracao-luxo', 'upgrade-arvore-maior', 'kit-essencial-enfeites', 'pisca-led-especial');
