import { normalizeText } from "@/lib/text/normalize";
import type { Demand } from "@/types/produtor";
import { findOffer, remainingQuantity } from "./demands";

export type MuralSort = "recent" | "priceDesc" | "missingDesc" | "nameAsc";
export type OfferFilter = "all" | "open" | "closed";
export type OfferSort = "recent" | "offeredDesc" | "nameAsc";

const newest = (a: Demand, b: Demand) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm);
const byProduct = (a: Demand, b: Demand) => {
  const left = normalizeText(a.produto);
  const right = normalizeText(b.produto);
  return left < right ? -1 : left > right ? 1 : 0;
};

// Mural: cada ordem é uma comparação; sem preço vai para o fim.
const MURAL_ORDER: Record<MuralSort, (a: Demand, b: Demand) => number> = {
  recent: newest,
  priceDesc: (a, b) => (b.precoMedio ?? -1) - (a.precoMedio ?? -1),
  missingDesc: (a, b) => remainingQuantity(b) - remainingQuantity(a),
  nameAsc: byProduct,
};

export function sortMural(demands: Demand[], sort: MuralSort): Demand[] {
  return [...demands].sort(MURAL_ORDER[sort]);
}

// "Em aberto" ainda aceita oferta de outros produtores; qualquer outro status conta como fechada.
export function filterOffers(demands: Demand[], filter: OfferFilter): Demand[] {
  if (filter === "open") return demands.filter((demand) => demand.status === "ABERTA");
  if (filter === "closed") return demands.filter((demand) => demand.status !== "ABERTA");
  return demands;
}

export function offerCounts(demands: Demand[]): { all: number; open: number; closed: number } {
  const open = filterOffers(demands, "open").length;
  return { all: demands.length, open, closed: demands.length - open };
}

export function sortOffers(demands: Demand[], sort: OfferSort, email: string): Demand[] {
  const mine = (demand: Demand) => findOffer(demand, email)?.quantidade ?? 0;
  const order: Record<OfferSort, (a: Demand, b: Demand) => number> = {
    recent: newest,
    offeredDesc: (a, b) => mine(b) - mine(a),
    nameAsc: byProduct,
  };
  return [...demands].sort(order[sort]);
}
