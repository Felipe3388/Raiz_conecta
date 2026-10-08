export type TransitionDirection = "forward" | "back" | "none";

// Posição de cada tela no fluxo de entrada: avançar é aumentar a posição, voltar é diminuir.
export const SCREEN_DEPTH = {
  login: 0,
  cadastro: 1,
  "completar-perfil": 2,
  "em-analise": 3,
} as const;

export type AuthScreenName = keyof typeof SCREEN_DEPTH;

export function directionBetween(from: number | null, to: number): TransitionDirection {
  if (from === null || from === to) return "none";
  return to > from ? "forward" : "back";
}

// Guarda a última tela aberta para saber de que lado a próxima deve entrar.
export function createTransitionTracker() {
  let lastDepth: number | null = null;

  return {
    enter(screen: AuthScreenName): TransitionDirection {
      const depth = SCREEN_DEPTH[screen];
      const direction = directionBetween(lastDepth, depth);
      lastDepth = depth;
      return direction;
    },
  };
}
