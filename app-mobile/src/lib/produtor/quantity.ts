// Quantidade digitada ou ajustada com + e −: inteiro entre 0 e o máximo. Valor inválido vira 0.
export function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.floor(value)), max);
}

// O slider de quantidade: onde o dedo está na barra (em pixels) vira uma quantidade inteira de 0 ao máximo...
export function valueFromPosition(x: number, width: number, max: number): number {
  if (!(width > 0) || !(max > 0)) return 0;
  return clampQuantity(Math.round((Math.min(Math.max(x, 0), width) / width) * max), max);
}

// ...e a quantidade vira o ponto da barra (de 0 a 1) onde o botão do slider e o preenchimento ficam.
export function positionFraction(value: number, max: number): number {
  if (!(max > 0)) return 0;
  return Math.min(Math.max(value, 0), max) / max;
}
