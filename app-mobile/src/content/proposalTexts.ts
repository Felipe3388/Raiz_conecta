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
  RECUSADA: "Você recusou este pedido.",
  EXPIRADA: "O prazo acabou sem resposta.",
};

// O aviso de que o prazo está acabando (menos de 2 minutos).
export const URGENT_SECONDS = 120;

export const PRICE_NOTE = "Preço fixo por kg.";

export const OFFERS_EMPTY = {
  title: "Nenhum pedido por enquanto.",
  description: "Os pedidos dos mercados chegam aqui.",
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

// O que o produtor vê em cada produto do pedido: o que o mercado pediu e o que ele oferece.
export const OFFER_TEXTS = {
  asked: "PEDIDO",
  offered: "VOCÊ OFERECE",
  progress: (percent: number, kind: "none" | "partial" | "full"): string =>
    kind === "none"
      ? "Arraste ou digite a quantidade"
      : kind === "full"
        ? "Você atende 100% deste pedido"
        : `Você atende ${percent}% deste pedido`,
} as const;

// A demanda dos mercados por produto (resumo no topo de Ofertas).
export const DEMAND_TEXTS = {
  title: "Demanda dos mercados",
  summary: (percent: number, products: number): string =>
    `${products} ${products === 1 ? "produto" : "produtos"} · você cobre ${percent}%`,
  asked: "pedidos",
  offered: "você oferece",
  markets: (count: number): string => `${count} ${count === 1 ? "mercado" : "mercados"}`,
  show: "Ver demanda por produto",
  hide: "Esconder demanda",
} as const;
