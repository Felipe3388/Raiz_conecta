import type { WeigherRole } from "@/types/delivery";
import type { DeliveryCard } from "./card";

// A pesagem de um pedido anda produto por produto. Estas regras dizem por qual produto começar e para qual ir depois.

const needsWeighing = (item: DeliveryCard, role: WeigherRole) =>
  role === "PRODUTOR" ? item.weighing.verdict !== "NA_FAIXA" : item.receipt === null;

// Por onde começar: o primeiro produto que ainda pede pesagem (o produtor: sem peso ou fora da faixa; o mercado: sem
// pesagem). Se não há nenhum, o primeiro, para revisar.
export function firstItemToWeigh(items: DeliveryCard[], role: WeigherRole): string {
  return (items.find((item) => needsWeighing(item, role)) ?? items[0])?.delivery.id ?? "";
}

// Para onde ir depois de `currentId`. O produtor segue a ordem da lista e termina no último. O mercado vai ao próximo
// produto sem pesagem (e volta aos que ficaram para trás); termina quando todos foram pesados.
export function nextItemToWeigh(items: DeliveryCard[], currentId: string, role: WeigherRole): string | null {
  const index = items.findIndex((item) => item.delivery.id === currentId);
  if (index < 0) return null;

  if (role === "PRODUTOR") return items[index + 1]?.delivery.id ?? null;
  const after = [...items.slice(index + 1), ...items.slice(0, index)];
  return after.find((item) => needsWeighing(item, role))?.delivery.id ?? null;
}

export function previousItem(items: DeliveryCard[], currentId: string): string | null {
  const index = items.findIndex((item) => item.delivery.id === currentId);
  return index > 0 ? items[index - 1].delivery.id : null;
}
