import type { MarketData } from "@/lib/pricing/insights";
import { priceKey } from "@/lib/pricing/price";
import type { PriceSignal } from "@/lib/pricing/suggestion";

const asked = (...prices: number[]): PriceSignal[] => prices.map((price) => ({ kind: "asked", price }));
const accepted = (price: number): PriceSignal => ({ kind: "accepted", price });
const rejected = (price: number): PriceSignal => ({ kind: "rejected", price });

// O que a plataforma já sabe de cada produto (por chave): preços que outros produtores pedem e como
// responderam a propostas. É dado de exemplo: serve para o preço sugerido ter de onde partir.
export const MOCK_PRICE_SIGNALS: Record<string, PriceSignal[]> = {
  [priceKey("Tomate")]: [...asked(42, 44, 47, 45, 48), rejected(38), rejected(41), accepted(44)],
  [priceKey("Alface")]: [...asked(2.8, 3, 3.2, 2.9), rejected(2.4), accepted(2.9)],
  [priceKey("Cenoura")]: [...asked(4.2, 4.5, 4.8, 4.4), rejected(3.8)],
  [priceKey("Banana")]: [...asked(36, 38, 40, 37), accepted(36)],
  [priceKey("Mandioca")]: [...asked(2.8, 3, 3.2)],
  [priceKey("Cebola")]: [...asked(3.6, 3.8, 4)],
  [priceKey("Maçã")]: [...asked(65, 70, 72)],
  [priceKey("Abóbora")]: [...asked(2.7, 2.9, 3.1)],
};

// Vendas do período e do anterior, por produto: de onde vem o "está vendendo mais ou menos".
export const MOCK_MARKET: MarketData[] = [
  {
    produto: "Tomate",
    unidade: "Caixa",
    askedPrices: [],
    sales: [
      { price: 42, units: 120 },
      { price: 45, units: 180 },
      { price: 48, units: 60 },
    ],
    previousUnits: 300,
  },
  {
    produto: "Alface",
    unidade: "Maço",
    askedPrices: [],
    sales: [
      { price: 2.9, units: 200 },
      { price: 3.2, units: 150 },
    ],
    previousUnits: 420,
  },
  {
    produto: "Cenoura",
    unidade: "Kg",
    askedPrices: [],
    sales: [
      { price: 4.3, units: 300 },
      { price: 4.6, units: 250 },
    ],
    previousUnits: 540,
  },
  {
    produto: "Banana",
    unidade: "Caixa",
    askedPrices: [],
    sales: [
      { price: 36, units: 40 },
      { price: 39, units: 70 },
    ],
    previousUnits: 80,
  },
  {
    produto: "Mandioca",
    unidade: "Kg",
    askedPrices: [],
    sales: [
      { price: 2.9, units: 600 },
      { price: 3.2, units: 300 },
    ],
    previousUnits: 1000,
  },
  {
    produto: "Cebola",
    unidade: "Kg",
    askedPrices: [],
    sales: [{ price: 3.7, units: 400 }],
    previousUnits: 380,
  },
];

// Preços que quem entra já tem no catálogo (Tomate e Alface). Os demais ficam sem preço.
export function seedMyPrices(_email: string): Record<string, number> {
  return { [priceKey("Tomate")]: 46, [priceKey("Alface")]: 3.1 };
}
