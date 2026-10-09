import { normalizeText } from "@/lib/text/normalize";
import type { Delivery, DeliveryStage } from "@/types/delivery";
import { addDays, dayKey, dayLabel, dayOffset } from "./schedule";
import { deliveryExpectedKg, stageOf, totalWeighedKg } from "./stage";
import { roundKg } from "./weight";

// Aba das entregas já conferidas pelo mercado (recebidas ou divergentes).
export const DONE_FILTER = "done";

const DONE_STAGES: DeliveryStage[] = ["RECEBIDA", "DIVERGENTE"];
// Etapas em que ainda cabe ao produtor separar, pesar ou entregar.
const PRODUCER_STAGES: DeliveryStage[] = ["A_SEPARAR", "PRONTA"];

const isDone = (delivery: Delivery) => DONE_STAGES.includes(stageOf(delivery));
const isOpenForProducer = (delivery: Delivery) => PRODUCER_STAGES.includes(stageOf(delivery));

// Atrasada: o dia combinado passou e a entrega ainda não saiu das mãos do produtor.
export function isLate(delivery: Delivery, today: Date): boolean {
  return isOpenForProducer(delivery) && dayOffset(delivery.dueDate, today) < 0;
}

// O dia em que a entrega aparece: o que ficou para trás e ainda não terminou passa a valer hoje.
function shownDay(delivery: Delivery, today: Date): string {
  return dayOffset(delivery.dueDate, today) < 0 ? dayKey(today) : delivery.dueDate;
}

export interface DayChip {
  id: string;
  label: string;
  count: number;
}

// As abas: Hoje e Amanhã sempre, os outros dias só se tiverem entrega, e "Concluídas" no fim.
export function dayChips(deliveries: Delivery[], today: Date): DayChip[] {
  const todayKey = dayKey(today);
  const tomorrowKey = addDays(todayKey, 1);
  const counts = new Map<string, number>([
    [todayKey, 0],
    [tomorrowKey, 0],
  ]);

  let done = 0;
  for (const delivery of deliveries) {
    if (isDone(delivery)) {
      done += 1;
      continue;
    }
    const day = shownDay(delivery, today);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const chips = [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => ({ id, label: dayLabel(id, today), count }));
  return done > 0 ? [...chips, { id: DONE_FILTER, label: "Concluídas", count: done }] : chips;
}

const byProduct = (a: Delivery, b: Delivery) => {
  const left = normalizeText(a.produto);
  const right = normalizeText(b.produto);
  return left < right ? -1 : left > right ? 1 : 0;
};

// Entregas de uma aba. No dia, as atrasadas vêm primeiro; o resto, por nome do produto.
export function filterDeliveries(deliveries: Delivery[], filter: string, today: Date): Delivery[] {
  if (filter === DONE_FILTER) return deliveries.filter(isDone).sort(byProduct);
  return deliveries
    .filter((delivery) => !isDone(delivery) && shownDay(delivery, today) === filter)
    .sort((a, b) => Number(isLate(b, today)) - Number(isLate(a, today)) || byProduct(a, b));
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

// Quantas entregas pedem uma ação do produtor hoje (são de hoje ou estão atrasadas): vira o número da aba.
export function pendingCount(deliveries: Delivery[], today: Date): number {
  return deliveries.filter((delivery) => isOpenForProducer(delivery) && dayOffset(delivery.dueDate, today) <= 0).length;
}
