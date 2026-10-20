import type { DeliveryCard } from "@/lib/delivery/card";
import type { OrderCard } from "@/lib/delivery/orderCard";
import { formatKg } from "@/lib/format/weight";
import { roundKg, type WeightJudgement, type WeightVerdict } from "@/lib/delivery/weight";
import type { DeliveryStage } from "@/types/delivery";
import type { IconName } from "@/types/icon";

export type StageTone = "success" | "warning" | "danger" | "neutral" | "info";

interface StageInfo {
  label: string;
  tone: StageTone;
  icon: IconName;
  // Frase curta que diz o que fazer (ou o que está acontecendo) nesta etapa.
  hint: string;
}

// Textos de cada etapa da entrega. As chaves são as etapas de lib/delivery/stage.
export const STAGE_INFO: Record<DeliveryStage, StageInfo> = {
  A_SEPARAR: {
    label: "A separar",
    tone: "warning",
    icon: "basket-outline",
    hint: "Separe os produtos do pedido e pese um a um na balança.",
  },
  PRONTA: {
    label: "Pronta",
    tone: "success",
    icon: "checkmark-circle-outline",
    hint: "Todos os produtos pesados. Entregue o pedido à logística quando ela chegar.",
  },
  COM_LOGISTICA: {
    label: "Com a logística",
    tone: "info",
    icon: "bus-outline",
    hint: "A logística está levando. O mercado confere o peso ao receber.",
  },
  RECEBIDA: {
    label: "Recebida",
    tone: "success",
    icon: "shield-checkmark-outline",
    hint: "O mercado recebeu e o peso de todos os produtos bateu.",
  },
  DIVERGENTE: {
    label: "Divergente",
    tone: "danger",
    icon: "alert-circle-outline",
    hint: "O mercado mediu algum produto fora da faixa.",
  },
};

// Dizem como está o peso, com a faixa aceita no meio da frase.
export const VERDICT_LABELS: Record<WeightVerdict, string> = {
  SEM_PESO: "Nada pesado ainda",
  ABAIXO: "Abaixo da faixa",
  NA_FAIXA: "Dentro da faixa",
  ACIMA: "Acima da faixa",
};

// Abaixo da faixa é só "ainda falta" (âmbar); acima da faixa é erro a corrigir (vermelho).
export const VERDICT_TONES: Record<WeightVerdict, StageTone> = {
  SEM_PESO: "neutral",
  ABAIXO: "warning",
  NA_FAIXA: "success",
  ACIMA: "danger",
};

export const SCALE_TEXTS = {
  connecting: "Conectando à balança...",
  lost: "A balança perdeu a conexão. Digite o peso ou tente de novo.",
  empty: "Coloque o produto na balança.",
  settling: "Aguarde o peso parar de oscilar...",
  stable: "Peso estável. Pode registrar.",
  locked: "Peso registrado. Tire o produto da balança para pesar o próximo lote.",
};

export const WEIGH_ERRORS = {
  manual: "Informe um peso válido, por exemplo 9,88.",
  nothing: "Ainda não há um peso estável para registrar.",
};

// "Separar hoje", "Separar para sex, 16/10".
export function pickListTitle(dayLabel: string): string {
  return dayLabel.toLowerCase().startsWith("hoje") ? "Separar hoje" : `Separar para ${dayLabel}`;
}

// A frase curta sobre o peso: "Dentro da faixa", "Faltam 0,5 kg para entrar na faixa", "Passou 1,5 kg do limite".
export function verdictSummary({ verdict, actualKg, range }: WeightJudgement): string {
  switch (verdict) {
    case "SEM_PESO":
    case "NA_FAIXA":
      return VERDICT_LABELS[verdict];
    case "ABAIXO":
      return `Faltam ${formatKg(roundKg(range.minKg - actualKg))} para entrar na faixa`;
    case "ACIMA":
      return `Passou ${formatKg(roundKg(actualKg - range.maxKg))} do limite`;
  }
}

interface ConfirmText {
  title: string;
  description: string;
  // Entregar com algum peso fora da faixa pede um aviso mais sério.
  warning: boolean;
}

// O que a janela de "Entregar pedido à logística" diz, conforme o peso pesado de cada produto.
export function orderHandOverText(card: OrderCard): ConfirmText {
  const count = card.itemCount === 1 ? "1 produto" : `${card.itemCount} produtos`;
  if (card.outOfRange.length === 0) {
    return {
      title: "Entregar o pedido à logística?",
      description: `${card.mercado}: ${count}, ${formatKg(card.weighedKg)} pesados, todos dentro da faixa. Depois de entregar, os pesos não podem mais ser mudados.`,
      warning: false,
    };
  }

  const names = card.outOfRange.map((item) => item.delivery.produto).join(", ");
  return {
    title: "Há peso fora da faixa. Entregar mesmo assim?",
    description: `Fora da faixa aceita: ${names}. O mercado será avisado da diferença. Depois de entregar, os pesos não podem mais ser mudados.`,
    warning: true,
  };
}

interface ItemStatus {
  label: string;
  tone: StageTone;
}

// A situação de um produto dentro do pedido, na linha da lista: a pesar, quanto pesou, o que o mercado mediu.
export function itemStatus(card: DeliveryCard): ItemStatus {
  if (card.receipt && card.delivery.receipt) {
    return {
      label: `Mercado: ${formatKg(card.delivery.receipt.kg)}`,
      tone: VERDICT_TONES[card.receipt.verdict],
    };
  }
  if (card.delivery.handedOverAt) return { label: `Entregue · ${formatKg(card.weighedKg)}`, tone: "info" };
  if (card.weighedKg > 0) return { label: formatKg(card.weighedKg), tone: VERDICT_TONES[card.weighing.verdict] };
  return { label: "A pesar", tone: "neutral" };
}
