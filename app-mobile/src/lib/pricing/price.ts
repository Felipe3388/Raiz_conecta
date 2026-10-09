import { normalizeText } from "@/lib/text/normalize";

// Nenhum preço de produto passa disso: evita erro de digitação (um zero a mais).
export const MAX_PRICE = 99999.99;

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Chave do produto nos preços: o mesmo produto escrito de formas diferentes cai no mesmo lugar.
export const priceKey = normalizeText;

// Lê o que a pessoa digitou: "3,5", "3.50", "R$ 3,50", "1.234,56". Devolve null se não for um preço válido.
export function parsePrice(text: string): number | null {
  const cleaned = text.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!/^\d[\d.,]*$/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    // Os dois aparecem: o que vem por último é o decimal e o outro separa os milhares.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalized = cleaned.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    if (cleaned.split(",").length > 2) return null;
    normalized = cleaned.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.234" é mil duzentos e trinta e quatro, não um preço com três casas.
    normalized = cleaned.split(".").join("");
  } else {
    if (cleaned.split(".").length > 2) return null;
    normalized = cleaned;
  }

  const value = roundCents(Number(normalized));
  return Number.isFinite(value) && value > 0 && value <= MAX_PRICE ? value : null;
}

// Para preencher o campo de edição: 3,50.
export function formatPriceInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
