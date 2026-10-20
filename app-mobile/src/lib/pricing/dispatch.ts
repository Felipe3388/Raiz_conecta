import { roundCents } from "./price";

// A escada do leilão inverso. Quem roda isto é o servidor (e os adms), não o app do produtor: o produtor só recebe
// uma proposta de cada vez, com o preço fixo daquele degrau, e não vê o preço do mercado nem os outros degraus.
// Aqui a regra existe para documentar o combinado e alimentar os dados de exemplo.

// O primeiro degrau é uma fração do preço que o mercado paga.
export const START_FACTOR = 0.8;
// Quanto cada recusa sobe o preço, em fração do preço do mercado.
export const LADDER_STEP = 0.02;
// Quantos degraus regulares, cada um para um produtor, antes da volta.
export const REGULAR_ROUNDS = 5;
// O teto vendido aos produtores. Se todos recusarem, o pedido volta ao primeiro produtor neste preço.
export const RETURN_FACTOR = 0.9;

export type LadderKind = "regular" | "return";

export interface LadderStep {
  // Posição na escada, a partir de 0.
  round: number;
  price: number;
  kind: LadderKind;
}

// Os preços de cada degrau para um pedido que o mercado paga a `marketPrice` por unidade.
export function buildLadder(marketPrice: number): LadderStep[] {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) return [];

  const regular = Array.from({ length: REGULAR_ROUNDS }, (_, round) => ({
    round,
    price: roundCents(marketPrice * (START_FACTOR + LADDER_STEP * round)),
    kind: "regular" as const,
  }));
  return [...regular, { round: REGULAR_ROUNDS, price: roundCents(marketPrice * RETURN_FACTOR), kind: "return" }];
}

export interface DispatchStep extends LadderStep {
  producer: string;
}

// Para quem cada degrau vai: um produtor por vez, em ordem, e a volta é para o primeiro da fila.
export function dispatchPlan(marketPrice: number, producers: string[]): DispatchStep[] {
  if (producers.length === 0) return [];
  return buildLadder(marketPrice).map((step) => ({
    ...step,
    producer: step.kind === "return" ? producers[0] : producers[step.round % producers.length],
  }));
}
