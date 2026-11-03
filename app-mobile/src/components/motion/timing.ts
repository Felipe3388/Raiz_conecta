import { Platform } from "react-native";

// O driver nativo não existe no navegador.
export const USE_NATIVE_DRIVER = Platform.OS !== "web";

const STAGGER_STEP_MS = 70;
const STAGGER_MAX_ITEMS = 8;

// Atraso de entrada de cada item de uma lista, para aparecerem em sequência.
export function staggerDelay(index: number): number {
  return Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP_MS;
}

// A troca de passo (StepTransition): o passo que sai leva 140 ms e o novo leva 280 ms para entrar. A voz da pesagem
// espera esse tempo para só falar do produto depois que ele já está parado na tela.
export const STEP_OUT_MS = 140;
export const STEP_IN_MS = 280;
