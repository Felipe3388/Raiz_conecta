// Quando a voz pode falar durante a pesagem. A regra é uma só: o produtor ouve o próximo produto depois de VER o
// produto na tela, nunca durante a confirmação verde nem durante a troca animada de passo.

import { STEP_IN_MS, STEP_OUT_MS } from "@/components/motion/timing";

// A troca de passo (StepTransition) leva um tempo para o passo antigo sair e o novo entrar. A voz espera isso e mais
// uma folga, para o texto já estar parado e legível quando começa a falar.
export const STEP_TRANSITION_MS = STEP_OUT_MS + STEP_IN_MS;
export const NARRATION_MARGIN_MS = 250;
export const NARRATION_DELAY_MS = STEP_TRANSITION_MS + NARRATION_MARGIN_MS;

export type NarrationKind = "weigh" | "between";

export interface NarrationInput {
  // Há uma pesagem aberta e a voz está ligada.
  enabled: boolean;
  // A confirmação verde ("Alface pesado!", "Pedido fechado!") está na tela.
  celebrating: boolean;
  // Está na pausa entre dois pedidos.
  between: boolean;
  // "weigh" (pesando um produto), "confirm" (conferindo o pedido, no modo manual) ou "between" (pausa entre pedidos).
  phase: "weigh" | "confirm" | "between" | undefined;
  // Existe o produto da vez para ler.
  hasItem: boolean;
}

export interface NarrationPlan {
  kind: NarrationKind;
  // Quanto esperar antes de falar.
  delayMs: number;
}

// O que dizer e quando. `null` = ficar em silêncio (e parar o que ainda estiver falando).
export function planNarration(input: NarrationInput): NarrationPlan | null {
  if (!input.enabled || input.celebrating) return null;
  if (input.between) return { kind: "between", delayMs: NARRATION_DELAY_MS };
  if (input.phase !== "weigh" || !input.hasItem) return null;
  return { kind: "weigh", delayMs: NARRATION_DELAY_MS };
}
