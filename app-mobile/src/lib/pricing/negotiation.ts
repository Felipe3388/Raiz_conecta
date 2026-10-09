import { roundCents } from "./price";

// A primeira proposta é uma fração do preço sugerido: começa baixo de propósito.
export const START_FACTOR = 0.8;
// Quantas propostas, no máximo, até chegar ao teto.
export const MAX_ROUNDS = 5;
// Depois de recusar, a próxima proposta demora um pouco: o produtor tem esse tempo para pensar
// e, se quiser, voltar atrás e aceitar a que acabou de recusar.
export const REFUSAL_PAUSE_MS = 5000;

export interface NegotiationInput {
  // Quanto o mercado paga neste pedido (o teto de qualquer proposta).
  marketPrice: number;
  // O preço que o produtor definiu no catálogo (preço ofertado), se definiu.
  producerPrice: number | null;
  // O preço médio sugerido pela plataforma, usado só como ponto de partida.
  suggestedPrice: number | null;
}

export type NegotiationAnswer = "accepted" | "rejected";
export type NegotiationOutcome = "open" | "deal" | "noDeal";

export interface Negotiation {
  // Propostas em ordem crescente.
  rounds: number[];
  // Respostas dadas pelo produtor (o fechamento automático não conta).
  answers: NegotiationAnswer[];
  outcome: NegotiationOutcome;
  dealPrice: number | null;
  // O acordo fechou sozinho porque a proposta chegou ao preço que o produtor pediu.
  autoAccepted: boolean;
  producerPrice: number | null;
}

// Até onde o sistema pode subir: o preço do produtor, mas nunca mais que o mercado paga.
function ceilingOf({ marketPrice, producerPrice }: NegotiationInput): number {
  return roundCents(producerPrice === null ? marketPrice : Math.min(marketPrice, producerPrice));
}

// Leilão inverso: parte de um preço baixo e sobe em degraus iguais até o teto.
export function planRounds(input: NegotiationInput): number[] {
  const ceiling = ceilingOf(input);
  const reference = input.suggestedPrice ?? ceiling;
  const start = Math.min(ceiling, roundCents(Math.max(0.01, reference * START_FACTOR)));
  if (start >= ceiling) return [ceiling];

  const rounds: number[] = [];
  for (let index = 0; index < MAX_ROUNDS; index++) {
    const price = roundCents(start + ((ceiling - start) * index) / (MAX_ROUNDS - 1));
    if (rounds.length === 0 || price > rounds[rounds.length - 1]) rounds.push(price);
  }
  return rounds;
}

// Chegou ao preço que o produtor pediu: ele já disse que esse valor serve.
function reachesProducerPrice(price: number, producerPrice: number | null): boolean {
  return producerPrice !== null && price >= producerPrice;
}

function settleAt(state: Negotiation, index: number): Negotiation {
  const price = state.rounds[index];
  if (reachesProducerPrice(price, state.producerPrice)) {
    return { ...state, outcome: "deal", dealPrice: price, autoAccepted: true };
  }
  return state;
}

export function startNegotiation(input: NegotiationInput): Negotiation {
  const rounds = planRounds(input);
  const state: Negotiation = {
    rounds,
    answers: [],
    outcome: "open",
    dealPrice: null,
    autoAccepted: false,
    producerPrice: input.producerPrice,
  };
  return settleAt(state, 0);
}

// A proposta que está na mesa, ou null quando a negociação já terminou.
export function currentProposal(state: Negotiation): number | null {
  return state.outcome === "open" ? state.rounds[state.answers.length] : null;
}

export function answerProposal(state: Negotiation, answer: NegotiationAnswer): Negotiation {
  const price = currentProposal(state);
  if (price === null) return state;

  const answers = [...state.answers, answer];
  if (answer === "accepted") {
    return { ...state, answers, outcome: "deal", dealPrice: price, autoAccepted: false };
  }

  const nextIndex = answers.length;
  if (nextIndex >= state.rounds.length) return { ...state, answers, outcome: "noDeal", dealPrice: null };
  return settleAt({ ...state, answers }, nextIndex);
}

export type RoundStatus = "rejected" | "accepted" | "current" | "pending" | "unused";

// Situação de cada proposta na trilha: recusada, aceita, a que está na mesa, as que virão
// e as que sobraram depois do acordo.
export function roundStatus(state: Negotiation, index: number): RoundStatus {
  if (state.outcome === "deal") {
    const acceptedIndex = state.rounds.findIndex((price) => price === state.dealPrice);
    if (index === acceptedIndex) return "accepted";
    return index < acceptedIndex ? "rejected" : "unused";
  }
  if (index < state.answers.length) return "rejected";
  return state.outcome === "open" && index === state.answers.length ? "current" : "pending";
}

// As propostas que o produtor já viu. As futuras ficam escondidas: ele responde a uma de cada vez, sem lista de
// opções para escolher. `showNext`: a próxima proposta já chegou (a pausa depois da recusa acabou).
export function visibleRounds(state: Negotiation, showNext: boolean): number[] {
  if (state.outcome === "noDeal") return state.rounds;
  if (state.outcome === "deal") return state.rounds.slice(0, state.rounds.indexOf(state.dealPrice ?? NaN) + 1);
  return state.rounds.slice(0, state.answers.length + (showNext ? 1 : 0));
}

// "Recusei agora, mas aceito": desfaz a última recusa e fecha o acordo nesse preço. Só vale enquanto a negociação
// segue aberta e a última resposta foi uma recusa.
export function reconsiderLast(state: Negotiation): Negotiation {
  if (state.outcome !== "open" || state.answers[state.answers.length - 1] !== "rejected") return state;
  return answerProposal({ ...state, answers: state.answers.slice(0, -1) }, "accepted");
}

// Segundos que faltam para a próxima proposta chegar (0 quando já chegou).
export function pauseSecondsLeft(until: number, now: number): number {
  return Math.max(0, Math.ceil((until - now) / 1000));
}
