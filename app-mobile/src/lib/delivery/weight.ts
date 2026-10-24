import { normalizeText } from "@/lib/text/normalize";

// Todo produto é vendido por quilo: 1 unidade do pedido = 1 kg (ex.: maçã a R$ 8,00/kg; 1 kg comprado = R$ 8,00).
// O pedido de 40 unidades é de 40 kg, e é esse peso que a balança precisa ler.
export const UNIT = "kg";

// Os quilos são guardados em gramas: tira os restos de decimais das contas (ex.: 12 × 1,1 = 13,200000000000001).
export function roundKg(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

// Peso que o pedido deve ter (em kg).
export function expectedKg(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return roundKg(quantity);
}

// Quanto o peso pode ficar abaixo e acima do esperado, em fração (0,02 = 2%).
export interface Tolerance {
  under: number;
  over: number;
}

// Combinado com o produtor: o peso pode variar 2% para menos e 2% para mais (10 kg pedidos aceitam de 9,8 a 10,2 kg).
// Vale para todos os produtos. Passar do limite é bloqueado, não só avisado: 999 kg num pedido de 10 kg não é aceito.
export const TOLERANCE_PERCENT = 0.02;
export const DEFAULT_TOLERANCE: Tolerance = { under: TOLERANCE_PERCENT, over: TOLERANCE_PERCENT };

// O menor peso aceito: a venda é de 1 kg no mínimo, então pedidos muito pequenos (1 kg) não aceitam menos que isso.
export const MIN_WEIGHING_KG = 1;

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
  const floor = Math.min(MIN_WEIGHING_KG, expected);
  return {
    minKg: Math.max(roundKg(expected * (1 - tolerance.under)), floor),
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

// Quanto vale o peso conferido: o preço é por kg (R$ 8,00/kg, 1 kg comprado = R$ 8,00).
export function valueForKg(kg: number, price: number | null): number {
  if (price === null || !(kg > 0)) return 0;
  return Math.round(kg * price * 100 + Number.EPSILON) / 100;
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
