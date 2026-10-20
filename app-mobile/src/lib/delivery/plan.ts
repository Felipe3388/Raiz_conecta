import { normalizeText } from "@/lib/text/normalize";
import type { Delivery, DeliveryStage } from "@/types/delivery";
import { isOrderDone, isOrderLate, isOrderOpen, type Order } from "./orders";
import { dayOffset, deliveryDayLabel, nextDeliveryDays } from "./schedule";
import { deliveryExpectedKg, stageOf, totalWeighedKg } from "./stage";
import { roundKg } from "./weight";

// Aba dos pedidos já conferidos pelo mercado (recebidos ou divergentes).
export const DONE_FILTER = "done";

// Etapas em que ainda cabe ao produtor separar, pesar ou entregar.
const PRODUCER_STAGES: DeliveryStage[] = ["A_SEPARAR", "PRONTA"];

const isOpenForProducer = (delivery: Delivery) => PRODUCER_STAGES.includes(stageOf(delivery));

// Atrasada: o dia combinado passou e a entrega ainda não saiu das mãos do produtor.
export function isLate(delivery: Delivery, today: Date): boolean {
  return isOpenForProducer(delivery) && dayOffset(delivery.dueDate, today) < 0;
}

export interface DayChip {
  id: string;
  label: string;
  count: number;
}

// Quantos dias de entrega aparecem sempre nas abas, mesmo sem pedidos.
const ALWAYS_SHOWN_DAYS = 2;

// O dia em que o pedido aparece: o que ficou para trás e ainda não terminou passa a valer o próximo dia de entrega.
function shownDay(order: Order, today: Date): string {
  return dayOffset(order.dueDate, today) < 0 ? nextDeliveryDays(today, 1)[0] : order.dueDate;
}

// As abas: os próximos dois dias de entrega sempre (terça e sexta), outros dias só se tiverem pedido, e "Concluídos"
// no fim.
export function dayChips(orders: Order[], today: Date): DayChip[] {
  const counts = new Map<string, number>(nextDeliveryDays(today, ALWAYS_SHOWN_DAYS).map((day) => [day, 0]));

  let done = 0;
  for (const order of orders) {
    if (isOrderDone(order)) {
      done += 1;
      continue;
    }
    const day = shownDay(order, today);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const chips = [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => ({ id, label: deliveryDayLabel(id, today), count }));
  return done > 0 ? [...chips, { id: DONE_FILTER, label: "Concluídos", count: done }] : chips;
}

const byMarket = (a: Order, b: Order) => {
  const left = normalizeText(a.mercado);
  const right = normalizeText(b.mercado);
  return left < right ? -1 : left > right ? 1 : 0;
};

// Pedidos de uma aba. No dia, os atrasados vêm primeiro; o resto, pelo nome do mercado. Os concluídos, do mais recente.
export function filterOrders(orders: Order[], filter: string, today: Date): Order[] {
  if (filter === DONE_FILTER) {
    return orders.filter(isOrderDone).sort((a, b) => b.dueDate.localeCompare(a.dueDate) || byMarket(a, b));
  }
  return orders
    .filter((order) => !isOrderDone(order) && shownDay(order, today) === filter)
    .sort((a, b) => Number(isOrderLate(b, today)) - Number(isOrderLate(a, today)) || byMarket(a, b));
}

export interface PickItem {
  produto: string;
  orders: number;
  // Quanto foi pedido em cada unidade (ex.: 50 Caixas).
  units: { unidade: string; quantidade: number }[];
  expectedKg: number;
  weighedKg: number;
  remainingKg: number;
  // Quanto já foi pesado, de 0 a 100.
  percent: number;
}

// "Separar hoje": o que precisa estar separado, somando os pedidos do mesmo produto.
// Só entra o que ainda é do produtor; o que já foi para a logística não precisa mais ser separado.
export function buildPickList(deliveries: Delivery[]): PickItem[] {
  const groups = new Map<string, Delivery[]>();
  for (const delivery of deliveries.filter(isOpenForProducer)) {
    const key = normalizeText(delivery.produto);
    groups.set(key, [...(groups.get(key) ?? []), delivery]);
  }

  return [...groups.values()]
    .map((group) => {
      const units = new Map<string, number>();
      for (const delivery of group)
        units.set(delivery.unidade, (units.get(delivery.unidade) ?? 0) + delivery.quantidade);
      const expected = roundKg(group.reduce((sum, delivery) => sum + deliveryExpectedKg(delivery), 0));
      const weighed = roundKg(group.reduce((sum, delivery) => sum + totalWeighedKg(delivery), 0));
      return {
        produto: group[0].produto,
        orders: group.length,
        units: [...units.entries()].map(([unidade, quantidade]) => ({ unidade, quantidade })),
        expectedKg: expected,
        weighedKg: weighed,
        remainingKg: Math.max(0, roundKg(expected - weighed)),
        percent: expected > 0 ? Math.min(100, (weighed / expected) * 100) : 0,
      };
    })
    .sort((a, b) => {
      const left = normalizeText(a.produto);
      const right = normalizeText(b.produto);
      return left < right ? -1 : left > right ? 1 : 0;
    });
}

// Quantos pedidos pedem ação do produtor até o próximo dia de entrega (são desse dia ou estão atrasados): vira o
// número da aba.
export function pendingCount(orders: Order[], today: Date): number {
  const [nextDay] = nextDeliveryDays(today, 1);
  return orders.filter((order) => isOrderOpen(order) && order.dueDate <= nextDay).length;
}
