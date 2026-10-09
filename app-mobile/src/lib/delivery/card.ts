import type { Delivery, DeliveryStage } from "@/types/delivery";
import { isLate } from "./plan";
import { dayLabel } from "./schedule";
import {
  availableActions,
  deliveryExpectedKg,
  progressPercent,
  receiptJudgement,
  stageOf,
  totalWeighedKg,
  weighingJudgement,
  type DeliveryAction,
} from "./stage";
import { valueForKg, type WeightJudgement } from "./weight";

export interface DeliveryCard {
  delivery: Delivery;
  stage: DeliveryStage;
  late: boolean;
  dayLabel: string;
  expectedKg: number;
  weighedKg: number;
  percent: number;
  // Peso do produtor contra o esperado e, depois de receber, o do mercado.
  weighing: WeightJudgement;
  receipt: WeightJudgement | null;
  actions: DeliveryAction[];
  // Quanto vale: o pedido inteiro ainda não conferido, ou o peso que o mercado mediu (valueConfirmed).
  value: number | null;
  valueConfirmed: boolean;
  // Foi entregue à logística com o peso fora da faixa.
  sentOutOfRange: boolean;
}

// Junta, para uma entrega, tudo o que o cartão mostra, calculado pelas regras de lib/delivery.
export function describeDelivery(delivery: Delivery, today: Date): DeliveryCard {
  const receipt = receiptJudgement(delivery);
  const confirmed = delivery.receipt !== null;
  const value =
    delivery.preco === null
      ? null
      : confirmed
        ? valueForKg(delivery.receipt?.kg ?? 0, delivery.unidade, delivery.preco)
        : Math.round(delivery.quantidade * delivery.preco * 100) / 100;

  return {
    delivery,
    stage: stageOf(delivery),
    late: isLate(delivery, today),
    dayLabel: dayLabel(delivery.dueDate, today),
    expectedKg: deliveryExpectedKg(delivery),
    weighedKg: totalWeighedKg(delivery),
    percent: progressPercent(delivery),
    weighing: weighingJudgement(delivery),
    receipt,
    actions: availableActions(delivery),
    value,
    valueConfirmed: confirmed,
    sentOutOfRange: delivery.handedOverOutOfRange,
  };
}
