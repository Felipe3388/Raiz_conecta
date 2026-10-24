import type { Delivery, DeliveryStage } from "@/types/delivery";
import { expectedKg, judgeWeight, roundKg, toleranceFor, type WeightJudgement } from "./weight";

// Peso que o pedido deve ter, em kg.
export function deliveryExpectedKg(delivery: Delivery): number {
  return expectedKg(delivery.quantidade);
}

// Tudo o que o produtor já pesou (os lotes se somam).
export function totalWeighedKg(delivery: Delivery): number {
  return roundKg(delivery.weighings.reduce((sum, item) => sum + item.kg, 0));
}

// O peso do produtor contra o esperado: mínimo e máximo, a mesma faixa dos dois lados (±2%).
export function weighingJudgement(delivery: Delivery): WeightJudgement {
  const total = totalWeighedKg(delivery);
  return judgeWeight(deliveryExpectedKg(delivery), total > 0 ? total : null, toleranceFor(delivery.produto));
}

// O peso do mercado contra o esperado, ou null se ele ainda não pesou.
export function receiptJudgement(delivery: Delivery): WeightJudgement | null {
  if (!delivery.receipt) return null;
  return judgeWeight(deliveryExpectedKg(delivery), delivery.receipt.kg, toleranceFor(delivery.produto));
}

export function remainingKg(delivery: Delivery): number {
  return Math.max(0, roundKg(deliveryExpectedKg(delivery) - totalWeighedKg(delivery)));
}

// Quanto do peso esperado já foi pesado (0 a 100).
export function progressPercent(delivery: Delivery): number {
  const expected = deliveryExpectedKg(delivery);
  if (expected <= 0) return 0;
  return Math.min(100, (totalWeighedKg(delivery) / expected) * 100);
}

// Todas as etapas, na ordem em que acontecem.
export const DELIVERY_STAGES: DeliveryStage[] = ["A_SEPARAR", "PRONTA", "COM_LOGISTICA", "RECEBIDA", "DIVERGENTE"];

function isReceiptOutOfRange(delivery: Delivery): boolean {
  const judgement = receiptJudgement(delivery);
  return judgement !== null && judgement.verdict !== "NA_FAIXA";
}

// A etapa não é guardada: sai dos fatos (pesagens, entrega à logística, recebimento). Assim ela nunca fica
// em desacordo com o que aconteceu. Vale a primeira regra que combinar, da etapa mais avançada para a mais cedo.
const STAGE_RULES: { stage: DeliveryStage; when: (delivery: Delivery) => boolean }[] = [
  { stage: "DIVERGENTE", when: isReceiptOutOfRange },
  { stage: "RECEBIDA", when: (d) => d.receipt !== null },
  { stage: "COM_LOGISTICA", when: (d) => d.handedOverAt !== null },
  { stage: "PRONTA", when: (d) => weighingJudgement(d).verdict === "NA_FAIXA" },
];

export function stageOf(delivery: Delivery): DeliveryStage {
  return STAGE_RULES.find((rule) => rule.when(delivery))?.stage ?? "A_SEPARAR";
}

export type DeliveryAction = "WEIGH" | "HAND_OVER" | "RECEIVE";

// O que dá para fazer em cada etapa. Entregar com o peso fora da faixa é possível, mas o app pede confirmação.
const ACTIONS_BY_STAGE: Record<DeliveryStage, (delivery: Delivery) => DeliveryAction[]> = {
  A_SEPARAR: (d) => (d.weighings.length > 0 ? ["WEIGH", "HAND_OVER"] : ["WEIGH"]),
  PRONTA: () => ["WEIGH", "HAND_OVER"],
  COM_LOGISTICA: () => ["RECEIVE"],
  RECEBIDA: () => [],
  DIVERGENTE: () => [],
};

export function availableActions(delivery: Delivery): DeliveryAction[] {
  return ACTIONS_BY_STAGE[stageOf(delivery)](delivery);
}
