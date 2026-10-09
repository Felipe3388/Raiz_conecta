import { roundCents } from "./price";

export type PriceFit = "none" | "within" | "above";

export interface PriceFitResult {
  fit: PriceFit;
  // Quanto o preço do produtor passa do que o mercado paga (0 quando cabe).
  difference: number;
}

// Confronta o preço que o produtor pede (y) com o que o mercado paga neste pedido (x).
export function priceFit(producerPrice: number | null, marketPrice: number | null): PriceFitResult {
  if (producerPrice === null || marketPrice === null) return { fit: "none", difference: 0 };
  if (producerPrice <= marketPrice) return { fit: "within", difference: 0 };
  return { fit: "above", difference: roundCents(producerPrice - marketPrice) };
}
