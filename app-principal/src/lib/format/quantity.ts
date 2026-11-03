// O que a pessoa digitou num campo de quantidade, arrumado: número inteiro dentro dos limites, ou null se não der
// para entender (campo vazio, letras). Quem chama decide o que fazer com o null (manter o valor anterior).
export function parseQuantity(text: string, min: number, max: number): number | null {
  if (text.trim() === "") return null;
  const value = Math.floor(Number(text.replace(",", ".")));
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

export const stepQuantity = (value: number, delta: number, min: number, max: number) => Math.min(max, Math.max(min, value + delta));
