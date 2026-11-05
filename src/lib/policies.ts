import type { SettingsMap } from "@/lib/settings";

export type Policy = { slug: string; title: string; settingKey: keyof SettingsMap; body: (s: SettingsMap) => string };

const contato = (s: SettingsMap) =>
  [s.contact_whatsapp && `WhatsApp ${s.contact_whatsapp}`, s.contact_email && `e-mail ${s.contact_email}`].filter(Boolean).join(" ou ") ||
  "os canais de atendimento informados no rodapé do site";

// Textos padrão. Se o campo correspondente for preenchido em /admin/configuracoes, ele substitui o padrão.
export const POLICIES: Policy[] = [
  {
    slug: "trocas-e-devolucoes",
    title: "Trocas e devoluções",
    settingKey: "policy_exchange",
    body: (s) => `Direito de arrependimento
Você pode desistir da compra em até 7 (sete) dias corridos após o recebimento do produto, conforme o art. 49 do Código de Defesa do Consumidor. Basta nos avisar por ${contato(s)} informando o número do pedido. Enviaremos as instruções de devolução, e o valor pago (incluindo eventuais fretes) é devolvido integralmente após recebermos o produto, pelo mesmo meio de pagamento ou por PIX para a conta do titular da compra.

Produto com defeito ou danificado no transporte
Se a árvore ou qualquer item do pedido chegar com defeito ou danificado, envie fotos ou vídeo por ${contato(s)} em até 7 dias após o recebimento. Faremos a troca sem nenhum custo para você ou, se preferir, o reembolso integral. Para defeitos que aparecerem depois, vale a garantia legal de 90 dias para produtos duráveis (art. 26 do CDC).

Condições
O produto devolvido por arrependimento deve estar com todos os itens e acessórios que acompanharam o pedido. O prazo para o reembolso é de até 10 dias úteis após o recebimento da devolução.`,
  },
  {
    slug: "entrega",
    title: "Política de entrega",
    settingKey: "policy_delivery",
    body: (s) => `Prazo
O prazo de entrega é de ${s.shipping_days || "3 a 5"} dias úteis, contados a partir da confirmação do pagamento. O frete é grátis para todo o Brasil.${s.christmas_deadline ? `\n\nNatal\nPedidos confirmados até ${s.christmas_deadline} são entregues antes do Natal.` : ""}

Rastreio
Assim que o pedido é postado, você recebe o código de rastreio por WhatsApp e e-mail.

Endereço
Confira os dados de entrega no checkout. Se precisar corrigir o endereço, fale com a gente por ${contato(s)} antes do envio.

Atrasos
Se o pedido não chegar no prazo informado, entre em contato. Acompanhamos a entrega junto à transportadora e, se o produto for extraviado, enviamos outro ou devolvemos o valor integral.`,
  },
  {
    slug: "privacidade",
    title: "Política de privacidade",
    settingKey: "policy_privacy",
    body: (s) => `Quais dados coletamos
Nome, e-mail, telefone, CPF e endereço de entrega informados no checkout, além de dados de navegação (como páginas visitadas e origem do acesso) coletados por cookies e pelo Pixel da Meta.

Para que usamos
Para processar o pagamento, emitir e entregar o pedido, prestar atendimento, enviar atualizações sobre o pedido e medir o desempenho dos nossos anúncios. O CPF é exigido pelo gateway de pagamento para gerar o PIX.

Com quem compartilhamos
Com o gateway de pagamento, a transportadora e as plataformas de anúncio (Meta), apenas no necessário para cada finalidade. Não vendemos seus dados.

Seus direitos (LGPD)
Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento por ${contato(s)}.`,
  },
  {
    slug: "termos",
    title: "Termos de uso",
    settingKey: "policy_terms",
    body: (s) => `Ao comprar em ${s.store_name}, você concorda com estes termos.

Produtos e preços
As fotos e descrições correspondem ao produto entregue. Os preços e condições valem para pedidos feitos enquanto estiverem publicados no site. O pedido é confirmado após a aprovação do pagamento via PIX.

Pagamento
O pagamento é feito via PIX, gerado no checkout. O código PIX tem validade limitada; se expirar, basta gerar um novo pedido.

Atendimento
Dúvidas, trocas e devoluções são tratadas por ${contato(s)}. Consulte também as políticas de entrega e de trocas e devoluções.`,
  },
];

export function getPolicy(slug: string) {
  return POLICIES.find((p) => p.slug === slug);
}

export function policyText(p: Policy, s: SettingsMap) {
  const custom = (s[p.settingKey] as string | undefined)?.trim();
  return custom || p.body(s);
}
