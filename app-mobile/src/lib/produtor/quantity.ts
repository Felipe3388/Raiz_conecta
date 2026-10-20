// Quantidade digitada ou ajustada com + e −: inteiro entre 0 e o máximo. Valor inválido vira 0.
export function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.floor(value)), max);
}
