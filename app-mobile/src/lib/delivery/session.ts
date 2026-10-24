import type { OrderCard } from "./orderCard";
import type { WeightVerdict } from "./weight";
import type { WeighingSource } from "@/types/delivery";

// A sessão de pesagem ("Iniciar pesagem"): o produtor pesa, um produto por vez, todos os produtos do dia, pedido
// depois de pedido. Estas regras dizem quais são os passos e como se anda entre eles, para qualquer tela.

export interface RunStep {
  orderKey: string;
  mercado: string;
  itemId: string;
  produto: string;
}

// Os passos de uma sessão: cada produto que ainda pede pesagem, na ordem dos pedidos. Pedidos que já saíram do
// produtor (com a logística, recebidos) e produtos já dentro da faixa ficam de fora.
export function buildRunSteps(cards: OrderCard[]): RunStep[] {
  return cards
    .filter((card) => card.actions.includes("WEIGH"))
    .flatMap((card) =>
      card.items
        .filter((item) => item.weighing.verdict !== "NA_FAIXA")
        .map((item) => ({
          orderKey: card.key,
          mercado: card.mercado,
          itemId: item.delivery.id,
          produto: item.delivery.produto,
        })),
    );
}

// "weigh": pesando o produto da vez. "confirm": no modo manual, o pedido todo foi pesado e falta confirmá-lo.
// "between": um pedido terminou e o próximo ainda não começou: uma pausa para o produtor se preparar (ou deixar o
// próximo pedido para depois). Nela, `index` continua no último produto do pedido que acabou de terminar.
export type RunPhase = "weigh" | "confirm" | "between";

export interface RunState {
  steps: RunStep[];
  index: number;
  phase: RunPhase;
  // Quantos pedidos o produtor deixou para depois nesta sessão.
  skipped: number;
}

// Segundos de pausa antes de começar o pedido seguinte.
export const BETWEEN_ORDERS_SECONDS = 5;

export function startRun(steps: RunStep[]): RunState | null {
  return steps.length === 0 ? null : { steps, index: 0, phase: "weigh", skipped: 0 };
}

export interface RunPosition {
  // Pedido da vez e quantos pedidos tem a sessão (a partir de 1).
  order: number;
  orders: number;
  // Produto da vez dentro do pedido e quantos produtos o pedido tem na sessão.
  item: number;
  items: number;
  // Passo da vez e total de passos da sessão.
  step: number;
  steps: number;
  isFirstOfOrder: boolean;
  isLastOfOrder: boolean;
  isLast: boolean;
}

export function runPosition(steps: RunStep[], index: number): RunPosition {
  const current = steps[index];
  const orderKeys = [...new Set(steps.map((step) => step.orderKey))];
  const inOrder = steps.filter((step) => step.orderKey === current?.orderKey);
  const item = current ? inOrder.findIndex((step) => step.itemId === current.itemId) + 1 : 0;

  return {
    order: current ? orderKeys.indexOf(current.orderKey) + 1 : 0,
    orders: orderKeys.length,
    item,
    items: inOrder.length,
    step: index + 1,
    steps: steps.length,
    isFirstOfOrder: item === 1,
    isLastOfOrder: item === inOrder.length,
    isLast: index === steps.length - 1,
  };
}

// Para onde ir depois do produto (ou do pedido) da vez; null quando a sessão acabou.
// Automático: segue direto para o próximo produto do pedido; ao acabar o pedido, faz a pausa antes do seguinte.
// Manual: ao fim de cada pedido pede a confirmação dele e então faz a mesma pausa.
export function advanceRun(state: RunState, autoWeigh: boolean): RunState | null {
  const position = runPosition(state.steps, state.index);
  if (state.phase === "between") return { ...state, index: state.index + 1, phase: "weigh" };
  if (state.phase === "confirm") return position.isLast ? null : { ...state, phase: "between" };
  if (!autoWeigh && position.isLastOfOrder) return { ...state, phase: "confirm" };
  if (position.isLast) return null;
  return position.isLastOfOrder ? { ...state, phase: "between" } : { ...state, index: state.index + 1 };
}

export interface BetweenInfo {
  // O pedido que acabou de terminar e o que vem agora.
  finishedMercado: string;
  nextMercado: string;
  nextItems: number;
}

// O que mostrar na pausa entre pedidos; null fora dela.
export function betweenInfo(state: RunState): BetweenInfo | null {
  if (state.phase !== "between") return null;
  const finished = state.steps[state.index];
  const next = state.steps[state.index + 1];
  if (!finished || !next) return null;
  return {
    finishedMercado: finished.mercado,
    nextMercado: next.mercado,
    nextItems: state.steps.filter((step) => step.orderKey === next.orderKey).length,
  };
}

// Na pausa, o produtor deixa o próximo pedido para depois: ele sai da sessão (e continua pendente em Entregas). Se
// ainda houver outro pedido, a pausa continua para ele (`betweenInfo` não é null); se não, a sessão acabou.
export function skipNextOrder(state: RunState): RunState {
  if (state.phase !== "between") return state;
  const skippedKey = state.steps[state.index + 1]?.orderKey;
  const steps = state.steps.filter((step, index) => index <= state.index || step.orderKey !== skippedKey);
  return { ...state, steps, skipped: state.skipped + 1 };
}

// Volta um passo: da confirmação ao último produto do pedido, ou ao produto anterior. Na pausa entre pedidos não há
// para onde voltar (o pedido anterior já foi pesado).
export function backRun(state: RunState): RunState {
  if (state.phase === "between") return state;
  if (state.phase === "confirm") return { ...state, phase: "weigh" };
  return state.index > 0 && state.steps[state.index - 1]?.orderKey === state.steps[state.index]?.orderKey
    ? { ...state, index: state.index - 1 }
    : state;
}

interface AutoRegisterInput {
  autoWeigh: boolean;
  source: WeighingSource;
  // O peso estável na balança (null enquanto oscila, está vazia ou já foi registrado).
  candidateKg: number | null;
  // Como fica o produto com esse peso somado ao que já foi registrado.
  verdict: WeightVerdict;
  saving: boolean;
  // O peso já ficou parado pelo tempo todo (STABLE_HOLD_SECONDS).
  held: boolean;
}

// No modo automático o app registra sozinho quando o peso parou (e ficou firme por 5 segundos) e está dentro da faixa.
// Peso fora da faixa nunca é registrado sozinho: quem decide é a pessoa.
export function shouldAutoRegister({
  autoWeigh,
  source,
  candidateKg,
  verdict,
  saving,
  held,
}: AutoRegisterInput): boolean {
  return autoWeigh && source === "BALANCA" && !saving && held && candidateKg !== null && verdict === "NA_FAIXA";
}

// A confirmação verde ao passar de produto (ou de pedido): aparece por 3 segundos, e o conteúdo de baixo troca no meio
// desse tempo, escondido por ela. Assim o próximo produto nunca aparece de repente.
export const CELEBRATION_MS = 3000;
export const CELEBRATION_SWAP_MS = 1500;

export type CelebrationKind = "item" | "order";

// O que a confirmação celebra ao seguir adiante: o produto pesado ou o pedido que fechou. Na pausa entre pedidos não
// há confirmação (ela já é uma tela própria). No modo manual o último produto leva à confirmação do pedido, que é
// quem fecha o pedido; no rápido, o último produto já fecha.
export function celebrationKind(state: RunState, autoWeigh: boolean): CelebrationKind | null {
  if (state.phase === "between") return null;
  if (state.phase === "confirm") return "order";
  return autoWeigh && runPosition(state.steps, state.index).isLastOfOrder ? "order" : "item";
}

// O passo que vem depois da confirmação, para ela dizer "em seguida": o próximo produto do mesmo pedido (produto) ou o
// primeiro do pedido seguinte (pedido). Null quando não há mais nada para pesar.
export function celebrationNext(state: RunState, kind: CelebrationKind): RunStep | null {
  const current = state.steps[state.index];
  const next = state.steps[state.index + 1];
  if (!current || !next) return null;
  const sameOrder = next.orderKey === current.orderKey;
  return (kind === "item") === sameOrder ? next : null;
}
