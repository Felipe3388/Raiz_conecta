// Atraso artificial dos serviços simulados: deixa os carregamentos aparecerem como na API real.
export const DEFAULT_MOCK_LATENCY_MS = 400;

export function wait(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
