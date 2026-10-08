import { includesText, normalizeText } from "@/lib/text/normalize";
import type { Demand, Offer } from "@/types/produtor";

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function fulfilledQuantity(demand: Demand): number {
  return demand.ofertas.reduce((total, offer) => total + offer.quantidade, 0);
}

export function remainingQuantity(demand: Demand): number {
  return Math.max(0, demand.quantidade - fulfilledQuantity(demand));
}

// Percentual já preenchido, entre 0 e 100.
export function progressPercent(demand: Demand): number {
  if (demand.quantidade <= 0) return 0;
  return Math.min(100, (fulfilledQuantity(demand) / demand.quantidade) * 100);
}

export function findOffer(demand: Demand, email: string): Offer | undefined {
  return demand.ofertas.find((offer) => sameEmail(offer.emailProdutor, email));
}

// Mural: demandas abertas, dos produtos que o produtor cultiva, em que ele ainda não ofertou.
export function muralDemands(demands: Demand[], email: string, productNames: string[]): Demand[] {
  const mine = new Set(productNames.map(normalizeText));
  return demands.filter(
    (demand) =>
      demand.status === "ABERTA" &&
      !findOffer(demand, email) &&
      mine.has(normalizeText(demand.produto)),
  );
}

// Ofertas: demandas em que o produtor já se comprometeu com uma quantidade.
export function offerDemands(demands: Demand[], email: string): Demand[] {
  return demands.filter((demand) => findOffer(demand, email) !== undefined);
}

export function filterByProduct(demands: Demand[], query: string): Demand[] {
  return demands.filter((demand) => includesText(demand.produto, query));
}

// Oferta válida: número inteiro positivo que cabe no que ainda falta.
export function canOffer(quantity: number, remaining: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= remaining;
}

export function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.floor(value)), max);
}
