import { roundCents } from "./price";

// O que a plataforma aprende sobre o preço de um produto:
// - asked: um produtor definiu esse preço no catálogo;
// - accepted: um produtor aceitou uma proposta nesse preço;
// - rejected: um produtor recusou uma proposta nesse preço.
export type PriceSignalKind = "asked" | "accepted" | "rejected";
// A resposta de um produtor a uma proposta de preço.
export type PriceAnswerKind = Exclude<PriceSignalKind, "asked">;

export interface PriceSignal {
  price: number;
  kind: PriceSignalKind;
}

// O preço sugerido é só uma referência (média); ele NÃO é o preço ofertado pelo produtor.
export interface SuggestedPrice {
  price: number;
  // Quantas informações entraram na conta.
  samples: number;
}

// Quanto cada resposta puxa o preço sugerido na sua direção.
export const ADJUST_RATE = 0.3;
// Recusou em um preço: o certo está um pouco acima dele.
const REJECT_MARGIN = 1.05;
// Preço fora dessa faixa em volta da mediana é tratado como erro de digitação.
const OUTLIER_LOW = 0.5;
const OUTLIER_HIGH = 2;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

// Média dos preços, sem os que fogem muito da mediana.
export function averagePrice(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const mid = median(prices);
  const kept = prices.filter((price) => price >= mid * OUTLIER_LOW && price <= mid * OUTLIER_HIGH);
  return kept.reduce((sum, price) => sum + price, 0) / kept.length;
}

// Preço sugerido: começa na média do que os produtores pedem e vai sendo ajustado, na ordem em que
// aconteceu, pelas respostas às propostas. Recusa acima do sugerido = estava baixo (sobe);
// aceite abaixo do sugerido = estava alto (desce). O resto confirma o preço e não muda nada.
export function suggestPrice(signals: PriceSignal[]): SuggestedPrice | null {
  const askedAverage = averagePrice(signals.filter((signal) => signal.kind === "asked").map((signal) => signal.price));
  const base =
    askedAverage ?? averagePrice(signals.filter((signal) => signal.kind === "accepted").map((signal) => signal.price));
  if (base === null) return null;

  // Se a média já nasceu dos aceites, eles não entram de novo como ajuste.
  const adjustByAccepts = askedAverage !== null;
  let price = base;
  for (const signal of signals) {
    if (signal.kind === "rejected" && signal.price >= price) {
      price += (signal.price * REJECT_MARGIN - price) * ADJUST_RATE;
    } else if (adjustByAccepts && signal.kind === "accepted" && signal.price < price) {
      price += (signal.price - price) * ADJUST_RATE;
    }
  }
  return { price: roundCents(price), samples: signals.length };
}
