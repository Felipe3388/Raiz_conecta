import { priceKey, roundCents } from "./price";
import { averagePrice } from "./suggestion";

export interface MarketData {
  produto: string;
  unidade: string;
  // Preços que os produtores definiram (preço ofertado) para este produto.
  askedPrices: number[];
  // O que foi vendido no período: a que preço e quantas unidades.
  sales: { price: number; units: number }[];
  // Unidades vendidas no período anterior.
  previousUnits: number;
}

export type SalesSignal = "up" | "steady" | "down";
export type PricePosition = "none" | "above" | "near" | "below";
export type PriceAdvice = "setPrice" | "lower" | "raise" | "keep";

export interface PriceInsight {
  produto: string;
  unidade: string;
  averageAsked: number | null;
  // Média dos preços em que realmente vendeu, ponderada pelo volume de cada venda.
  averageSold: number | null;
  soldUnits: number;
  // Variação das vendas contra o período anterior (0,25 = 25% a mais). Null sem período anterior.
  change: number | null;
  signal: SalesSignal;
  myPrice: number | null;
  position: PricePosition;
  advice: PriceAdvice;
}

// Variação pequena não é tendência.
const SALES_THRESHOLD = 0.05;
// Até 3% de diferença ainda é "na média".
const POSITION_THRESHOLD = 0.03;

function salesSignal(units: number, previous: number): { change: number | null; signal: SalesSignal } {
  if (previous <= 0) return { change: null, signal: units > 0 ? "up" : "steady" };
  const change = roundCents((units - previous) / previous);
  if (change > SALES_THRESHOLD) return { change, signal: "up" };
  if (change < -SALES_THRESHOLD) return { change, signal: "down" };
  return { change, signal: "steady" };
}

function positionOf(myPrice: number | null, average: number | null): PricePosition {
  if (myPrice === null || average === null) return "none";
  const gap = (myPrice - average) / average;
  if (gap > POSITION_THRESHOLD) return "above";
  if (gap < -POSITION_THRESHOLD) return "below";
  return "near";
}

function adviceFor(position: PricePosition, signal: SalesSignal): PriceAdvice {
  if (position === "none") return "setPrice";
  if (position === "above" && signal !== "up") return "lower";
  if (position === "below" && signal === "up") return "raise";
  return "keep";
}

// Preços e vendas de cada produto que o produtor cultiva, para o Painel.
// `myPrices` usa a chave do produto (priceKey) e o preço ofertado pelo produtor.
export function buildInsights(
  market: MarketData[],
  productNames: string[],
  myPrices: Record<string, number>,
): PriceInsight[] {
  const mine = new Set(productNames.map(priceKey));

  return market
    .filter((item) => mine.has(priceKey(item.produto)))
    .map((item) => {
      const soldUnits = item.sales.reduce((sum, sale) => sum + sale.units, 0);
      const revenue = item.sales.reduce((sum, sale) => sum + sale.price * sale.units, 0);
      const averageAsked = averagePrice(item.askedPrices);
      const myPrice = myPrices[priceKey(item.produto)] ?? null;
      const { change, signal } = salesSignal(soldUnits, item.previousUnits);
      const position = positionOf(myPrice, averageAsked);

      return {
        produto: item.produto,
        unidade: item.unidade,
        averageAsked: averageAsked === null ? null : roundCents(averageAsked),
        averageSold: soldUnits > 0 ? roundCents(revenue / soldUnits) : null,
        soldUnits,
        change,
        signal,
        myPrice,
        position,
        advice: adviceFor(position, signal),
      };
    })
    .sort((a, b) => b.soldUnits - a.soldUnits);
}

// Quantos produtos estão vendendo mais, estáveis e vendendo menos: o resumo do topo do Painel.
export function summarizeSignals(insights: PriceInsight[]): Record<SalesSignal, number> {
  const counts: Record<SalesSignal, number> = { up: 0, steady: 0, down: 0 };
  for (const insight of insights) counts[insight.signal] += 1;
  return counts;
}
