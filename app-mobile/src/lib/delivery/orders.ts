import { normalizeText } from "@/lib/text/normalize";
import type { Delivery, DeliveryStage } from "@/types/delivery";
import { dayOffset } from "./schedule";
import { DELIVERY_STAGES, stageOf } from "./stage";

// Um pedido: tudo o que um mercado comprou do produtor para o mesmo dia. Cada produto é uma entrega (Delivery) com as
// suas pesagens; o pedido só junta e resume.
export interface Order {
  key: string;
  mercado: string;
  dueDate: string;
  items: Delivery[];
}

export function orderKeyOf(delivery: Delivery): string {
  return `${delivery.dueDate}|${normalizeText(delivery.mercado)}`;
}

const byText = (a: string, b: string) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  return left < right ? -1 : left > right ? 1 : 0;
};

// Agrupa as entregas em pedidos, do dia mais próximo ao mais distante e, no mesmo dia, pelo nome do mercado.
// Dentro do pedido, os produtos ficam em ordem alfabética: é a ordem em que serão pesados.
export function groupOrders(deliveries: Delivery[]): Order[] {
  const orders = new Map<string, Order>();
  for (const delivery of deliveries) {
    const key = orderKeyOf(delivery);
    const order = orders.get(key) ?? { key, mercado: delivery.mercado, dueDate: delivery.dueDate, items: [] };
    order.items.push(delivery);
    orders.set(key, order);
  }

  return [...orders.values()]
    .map((order) => ({ ...order, items: [...order.items].sort((a, b) => byText(a.produto, b.produto)) }))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : byText(a.mercado, b.mercado)));
}

const DONE: DeliveryStage[] = ["RECEBIDA", "DIVERGENTE"];

// A etapa do pedido sai das etapas dos itens. Enquanto algum item não terminou, vale o menos adiantado deles; quando
// todos terminaram, o pedido é divergente se algum item foi.
export function orderStage(items: Delivery[]): DeliveryStage {
  const stages = items.map(stageOf);
  if (stages.length === 0) return "A_SEPARAR";

  const open = stages.filter((stage) => !DONE.includes(stage));
  if (open.length === 0) return stages.includes("DIVERGENTE") ? "DIVERGENTE" : "RECEBIDA";
  return open.reduce((least, stage) =>
    DELIVERY_STAGES.indexOf(stage) < DELIVERY_STAGES.indexOf(least) ? stage : least,
  );
}

// Etapas em que ainda cabe ao produtor separar, pesar ou entregar.
const PRODUCER_STAGES: DeliveryStage[] = ["A_SEPARAR", "PRONTA"];

export const isOrderDone = (order: Order): boolean => DONE.includes(orderStage(order.items));
export const isOrderOpen = (order: Order): boolean => PRODUCER_STAGES.includes(orderStage(order.items));

// Atrasado: o dia combinado passou e o pedido ainda não saiu das mãos do produtor.
export function isOrderLate(order: Order, today: Date): boolean {
  return isOrderOpen(order) && dayOffset(order.dueDate, today) < 0;
}
