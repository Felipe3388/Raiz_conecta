import { normalizeText } from "@/lib/text/normalize";

// Quanto pesa uma unidade de cada tipo de pedido. É daqui que "40 Caixas" vira os quilos que a balança vai ler.
// Chave: nome da unidade sem acento, minúsculo, no plural e no singular.
export const KG_PER_UNIT: Record<string, number> = {
  kg: 1,
  caixas: 20,
  caixa: 20,
  macos: 0.4,
  maco: 0.4,
};

// Unidade que não está na tabela conta como kg, para o pedido poder ser pesado do mesmo jeito.
const FALLBACK_KG_PER_UNIT = 1;

export function kgPerUnit(unit: string): number {
  return KG_PER_UNIT[normalizeText(unit)] ?? FALLBACK_KG_PER_UNIT;
}

// Os quilos são guardados em gramas: tira os restos de decimais das contas (ex.: 12 × 1,1 = 13,200000000000001).
export function roundKg(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

// Peso que o pedido deve ter (em kg).
export function expectedKg(quantity: number, unit: string): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return roundKg(quantity * kgPerUnit(unit));
}

// Quanto o peso pode ficar abaixo e acima do esperado, em fração (0,02 = 2%).
export interface Tolerance {
  under: number;
  over: number;
}

// Combinado com o produtor: 10 kg pedidos aceitam de 9,8 a 11 kg. Vale para todos os produtos.
export const DEFAULT_TOLERANCE: Tolerance = { under: 0.02, over: 0.1 };

// Exceções por produto (chave sem acento e minúscula): folhosas que murcham, por exemplo, podem ter faixa própria.
export const TOLERANCE_BY_PRODUCT: Record<string, Tolerance> = {};

export function toleranceFor(produto: string, table: Record<string, Tolerance> = TOLERANCE_BY_PRODUCT): Tolerance {
  return table[normalizeText(produto)] ?? DEFAULT_TOLERANCE;
}

export interface WeightRange {
  minKg: number;
  maxKg: number;
}

export function acceptedRange(expected: number, tolerance: Tolerance): WeightRange {
  return {
    minKg: roundKg(expected * (1 - tolerance.under)),
    maxKg: roundKg(expected * (1 + tolerance.over)),
  };
}

export type WeightVerdict = "SEM_PESO" | "ABAIXO" | "NA_FAIXA" | "ACIMA";

export interface WeightJudgement {
  verdict: WeightVerdict;
  // O peso esperado e o que foi pesado (0 se nada foi pesado).
  expectedKg: number;
  actualKg: number;
  // Peso menos o esperado (negativo = falta).
  diffKg: number;
  // O mesmo, em % do esperado.
  diffPercent: number;
  range: WeightRange;
}

// Compara o peso com o esperado. Os limites da faixa valem (11 kg em 10 kg esperados ainda passa).
export function judgeWeight(expected: number, actual: number | null, tolerance: Tolerance): WeightJudgement {
  const range = acceptedRange(expected, tolerance);
  if (expected <= 0 || actual === null || !(actual > 0)) {
    return { verdict: "SEM_PESO", expectedKg: expected, actualKg: 0, diffKg: 0, diffPercent: 0, range };
  }

  const weight = roundKg(actual);
  const diffKg = roundKg(weight - expected);
  const diffPercent = Math.round((diffKg / expected) * 1000) / 10;
  const verdict: WeightVerdict = weight < range.minKg ? "ABAIXO" : weight > range.maxKg ? "ACIMA" : "NA_FAIXA";
  return { verdict, expectedKg: expected, actualKg: weight, diffKg, diffPercent, range };
}

// Quanto vale o peso conferido: o preço é por unidade do pedido, então o peso volta a ser unidades.
export function valueForKg(kg: number, unit: string, price: number | null): number {
  if (price === null || !(kg > 0)) return 0;
  return Math.round((kg / kgPerUnit(unit)) * price * 100 + Number.EPSILON) / 100;
}

// Maior peso aceito numa pesagem (kg): barra erro de digitação, como um zero a mais.
export const MAX_WEIGHING_KG = 10000;

// Lê o peso digitado: "9,88", "9.88", "12,5 kg". Vírgula ou ponto valem como decimal (até gramas); nada de milhar.
// Devolve null se não for um peso válido.
export function parseKg(text: string): number | null {
  const cleaned = text.replace(/kg/gi, "").replace(/\s/g, "");
  if (!/^\d+([.,]\d{1,3})?$/.test(cleaned)) return null;
  const value = roundKg(Number(cleaned.replace(",", ".")));
  return value > 0 && value <= MAX_WEIGHING_KG ? value : null;
}
