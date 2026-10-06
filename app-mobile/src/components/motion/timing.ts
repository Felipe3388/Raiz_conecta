import { Platform } from "react-native";

// O driver nativo não existe no navegador.
export const USE_NATIVE_DRIVER = Platform.OS !== "web";

const STAGGER_STEP_MS = 70;
const STAGGER_MAX_ITEMS = 8;

// Atraso de entrada de cada item de uma lista, para aparecerem em sequência.
export function staggerDelay(index: number): number {
  return Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP_MS;
}
