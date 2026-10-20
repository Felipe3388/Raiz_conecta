import type { IconName } from "@/types/icon";
import type { ProposalStatus } from "@/types/proposal";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusInfo {
  label: string;
  tone: Tone;
  icon: IconName;
}

// Textos de cada situação do pedido. As chaves são as de lib/produtor/proposals.
export const PROPOSAL_STATUS_INFO: Record<ProposalStatus, StatusInfo> = {
  PENDENTE: { label: "Responder", tone: "warning", icon: "time-outline" },
  ACEITA: { label: "Aceito", tone: "success", icon: "checkmark-circle" },
  RECUSADA: { label: "Recusado", tone: "neutral", icon: "close-circle-outline" },
  EXPIRADA: { label: "Expirado", tone: "neutral", icon: "alarm-outline" },
};

export const PROPOSAL_CLOSED_NOTES: Partial<Record<ProposalStatus, string>> = {
  RECUSADA: "Você recusou. O pedido seguiu para outro produtor.",
  EXPIRADA: "O prazo acabou sem resposta. O pedido seguiu para outro produtor.",
};

export const PROPOSAL_ACCEPTED_NOTE = "Você aceitou. O que aceitou já está planejado em Entregas.";

// O aviso de que o prazo está acabando (menos de 2 minutos).
export const URGENT_SECONDS = 120;

export const PRICE_NOTE = "Preço fixo definido pela Raiz. Escolha quanto de cada produto você entrega.";

export const PARTIAL_NOTE = "O que você não aceitar segue para outros produtores, até o pedido ser completado.";

export const OFFERS_INTRO = "Cada pedido vale por 30 minutos. Aceite tudo ou só uma parte de cada produto.";

export const OFFERS_EMPTY = {
  title: "Nenhum pedido por enquanto.",
  description:
    "Quando um mercado pedir um dos seus produtos, o pedido chega aqui e por e-mail, com 30 minutos para responder. Mantenha o catálogo em dia.",
};

export const ORDER_ACTIONS = {
  acceptAll: "Aceitar tudo",
  clear: "Limpar",
  refuse: "Recusar pedido",
  confirm: "Confirmar quantidades",
};

export const ASK_TEXTS = {
  accept: { title: "Confirmar quantidades?", confirm: "Aceitar pedido", cancel: "Voltar" },
  refuse: { title: "Recusar este pedido?", confirm: "Recusar pedido", cancel: "Voltar" },
};
