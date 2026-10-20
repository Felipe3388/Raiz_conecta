import { describeDelivery, type DeliveryCard } from "./card";
import { isOrderLate, orderStage, type Order } from "./orders";
import { deliveryDayLabel } from "./schedule";
import type { DeliveryAction } from "./stage";
import { roundKg } from "./weight";
import type { DeliveryStage } from "@/types/delivery";

export interface OrderCard {
  order: Order;
  key: string;
  mercado: string;
  dueDate: string;
  dayLabel: string;
  late: boolean;
  stage: DeliveryStage;
  // Um cartão por produto, na ordem em que serão pesados.
  items: DeliveryCard[];
  itemCount: number;
  // Quantos produtos já têm pelo menos uma pesagem.
  weighedItems: number;
  expectedKg: number;
  weighedKg: number;
  // Quanto do peso esperado já foi pesado, de 0 a 100 (um excesso num produto não cobre a falta de outro).
  percent: number;
  actions: DeliveryAction[];
  // Produtos pesados fora da faixa aceita: o app avisa antes de entregar.
  outOfRange: DeliveryCard[];
  // Produtos que o mercado pesou fora da faixa.
  divergent: DeliveryCard[];
  // Quanto vale o pedido: pelos preços fixos até o mercado conferir (valueConfirmed), depois pelo peso medido.
  value: number;
  valueConfirmed: boolean;
}

// O que dá para fazer com o pedido inteiro. Entregar só quando todos os produtos têm peso; fora da faixa ainda é
// possível, mas o app pede confirmação.
function actionsFor(stage: DeliveryStage, allWeighed: boolean): DeliveryAction[] {
  if (stage === "A_SEPARAR" || stage === "PRONTA") return allWeighed ? ["WEIGH", "HAND_OVER"] : ["WEIGH"];
  if (stage === "COM_LOGISTICA") return ["RECEIVE"];
  return [];
}

// Junta, para um pedido, tudo o que o cartão mostra, calculado pelas regras de lib/delivery.
export function describeOrder(order: Order, today: Date): OrderCard {
  const items = order.items.map((delivery) => describeDelivery(delivery, today));
  const stage = orderStage(order.items);
  const weighedItems = items.filter((item) => item.weighedKg > 0).length;
  const expectedKg = roundKg(items.reduce((sum, item) => sum + item.expectedKg, 0));
  const counted = roundKg(items.reduce((sum, item) => sum + Math.min(item.weighedKg, item.expectedKg), 0));

  return {
    order,
    key: order.key,
    mercado: order.mercado,
    dueDate: order.dueDate,
    dayLabel: deliveryDayLabel(order.dueDate, today),
    late: isOrderLate(order, today),
    stage,
    items,
    itemCount: items.length,
    weighedItems,
    expectedKg,
    weighedKg: roundKg(items.reduce((sum, item) => sum + item.weighedKg, 0)),
    percent: expectedKg > 0 ? Math.min(100, (counted / expectedKg) * 100) : 0,
    actions: actionsFor(stage, items.length > 0 && weighedItems === items.length),
    outOfRange: items.filter((item) => item.weighedKg > 0 && item.weighing.verdict !== "NA_FAIXA"),
    divergent: items.filter((item) => item.receipt !== null && item.receipt.verdict !== "NA_FAIXA"),
    value: Math.round(items.reduce((sum, item) => sum + item.value, 0) * 100) / 100,
    valueConfirmed: items.length > 0 && items.every((item) => item.valueConfirmed),
  };
}
