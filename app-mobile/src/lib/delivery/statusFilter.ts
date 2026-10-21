import type { OrderCard } from "./orderCard";

// O filtro da lista de pedidos do dia: tudo, o que ainda falta pesar ou o que já está pronto para a logística.
export type StatusFilter = "all" | "toWeigh" | "toHandOver";

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "toWeigh", label: "Falta pesar" },
  { value: "toHandOver", label: "Para a logística" },
];

// Cada pedido cai em um só lugar: se todos os produtos já foram pesados, está pronto para a logística; se ainda falta
// pesar algum, está pendente. Pedidos que já saíram do produtor (com a logística, recebidos) não entram em nenhum.
const MATCHES: Record<StatusFilter, (card: OrderCard) => boolean> = {
  all: () => true,
  toWeigh: (card) => card.actions.includes("WEIGH") && !card.actions.includes("HAND_OVER"),
  toHandOver: (card) => card.actions.includes("HAND_OVER"),
};

export function filterByStatus(cards: OrderCard[], status: StatusFilter): OrderCard[] {
  return cards.filter(MATCHES[status]);
}

export function statusOptions(cards: OrderCard[]) {
  return STATUS_FILTERS.map((option) => ({ ...option, count: filterByStatus(cards, option.value).length }));
}
