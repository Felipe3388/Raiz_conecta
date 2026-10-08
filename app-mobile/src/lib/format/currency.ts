// Valor em reais no padrão brasileiro: R$ 1.234,50.
export function formatBRL(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const [integer, decimals] = amount.toFixed(2).split(".");
  const withDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${withDots},${decimals}`;
}
