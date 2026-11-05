import { db } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  store_name: "Senhor Natal",
  main_price_cents: "9700",
  compare_at_cents: "",
  shipping_days: "3 a 5",
  // Data-limite real informada pelo fornecedor (ex.: "15/12"). Vazio = a faixa não aparece.
  christmas_deadline: "",
  guarantee_text: "Você tem 7 dias após o recebimento para devolver e receber 100% do valor de volta",
  guarantee_days: "",
  guarantee_conditions:
    "Se a árvore chegar com defeito ou danificada no transporte, nós trocamos sem custo. Basta enviar uma foto pelo nosso WhatsApp em até 7 dias após o recebimento.",
  guarantee_how_to:
    "Fale com a gente pelo WhatsApp ou e-mail informando o número do pedido. Respondemos em até 1 dia útil e enviamos as instruções de devolução ou troca.",
  contact_email: "",
  contact_whatsapp: "",
  // Identificação do vendedor (Decreto 7.962/2013): razão social/nome, CNPJ ou CPF, endereço.
  company_info: "",
  spec_material: "",
  spec_dimensions: "",
  spec_weight: "",
  spec_package_contents: "",
  spec_cleaning: "",
  spec_usage: "",
  spec_capacity: "",
  spec_power: "",
  spec_battery: "",
  policy_privacy: "",
  policy_terms: "",
  policy_exchange: "",
  policy_delivery: "",
  demo_video_url: "",
  // Itens de "O que vem na caixa", um por linha (vazio = lista padrão).
  box_items: "",
  // Foto opcional dos itens da caixa (link).
  box_image_url: "",
};

export type SettingsMap = Record<string, string> & typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<SettingsMap> {
  const rows = await db.setting.findMany();
  const map: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string) {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
