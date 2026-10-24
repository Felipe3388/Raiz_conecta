import { priceKey } from "@/lib/pricing/price";
import type { PriceSignal } from "@/lib/pricing/suggestion";

const asked = (...prices: number[]): PriceSignal[] => prices.map((price) => ({ kind: "asked", price }));
const accepted = (price: number): PriceSignal => ({ kind: "accepted", price });
const rejected = (price: number): PriceSignal => ({ kind: "rejected", price });

// O que a plataforma já sabe de cada produto (por chave): preços por kg que outros produtores pedem e como
// responderam a propostas. É dado de exemplo: serve para o preço sugerido ter de onde partir.
export const MOCK_PRICE_SIGNALS: Record<string, PriceSignal[]> = {
  [priceKey("Tomate")]: [...asked(4.2, 4.4, 4.7, 4.5, 4.8), rejected(3.8), rejected(4.1), accepted(4.4)],
  [priceKey("Alface")]: [...asked(7, 7.5, 8, 7.3), rejected(6), accepted(7.2)],
  [priceKey("Cenoura")]: [...asked(4.2, 4.5, 4.8, 4.4), rejected(3.8)],
  [priceKey("Banana")]: [...asked(3.6, 3.8, 4, 3.7), accepted(3.6)],
  [priceKey("Mandioca")]: [...asked(2.8, 3, 3.2)],
  [priceKey("Cebola")]: [...asked(3.6, 3.8, 4)],
  [priceKey("Maçã")]: [...asked(7.5, 8, 8.4)],
  [priceKey("Abóbora")]: [...asked(2.7, 2.9, 3.1)],
};

// Preços que quem entra já tem no catálogo (Tomate e Alface). Os demais ficam sem preço.
export function seedMyPrices(_email: string): Record<string, number> {
  return { [priceKey("Tomate")]: 4.6, [priceKey("Alface")]: 7.8 };
}
