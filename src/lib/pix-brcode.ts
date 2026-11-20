// Gera o "PIX copia e cola" (BR Code / EMV do Banco Central) a partir de uma
// chave PIX, sem depender de API de banco. O dinheiro cai direto na conta dona
// da chave; a confirmação é MANUAL (admin dá baixa no pedido).
// Spec: Manual do BR Code (Bacen). CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF).

/** Remove acentos e caracteres fora do ASCII imprimível (campos 59/60 do EMV). */
function ascii(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim()
    .slice(0, max);
}

// Campo EMV: id (2) + tamanho (2, zero-padded) + valor.
const tlv = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Monta o copia-e-cola. amountCents em centavos (igual ao totalCents).
 * txid = referência do pedido (só [A-Za-z0-9], até 25 chars) — vai embutido no
 * código p/ ajudar a conciliar o pagamento com o pedido.
 */
export function buildPixCode(input: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid: string;
}): string {
  const amount = (input.amountCents / 100).toFixed(2); // "97.00"
  const txid = (input.txid.replace(/[^A-Za-z0-9]/g, "") || "***").slice(0, 25);
  const gui = tlv("00", "br.gov.bcb.pix") + tlv("01", input.key.trim());

  const payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("26", gui) + // Merchant Account Information (chave PIX)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: BRL
    tlv("54", amount) + // Valor
    tlv("58", "BR") + // País
    tlv("59", ascii(input.merchantName, 25) || "RECEBEDOR") +
    tlv("60", ascii(input.merchantCity, 15) || "SAO PAULO") +
    tlv("62", tlv("05", txid)); // Additional Data: txid

  const toCrc = payload + "6304"; // id+len do CRC entram no cálculo
  return toCrc + crc16(toCrc);
}
