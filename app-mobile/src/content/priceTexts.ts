import type { PriceAdvice, PricePosition, SalesSignal } from "@/lib/pricing/insights";

// Textos das médias de preço e venda do Painel. Os valores são as chaves das regras em lib/pricing.
export const SALES_SIGNAL_LABELS: Record<SalesSignal, string> = {
  up: "Vendendo mais",
  steady: "Vendas estáveis",
  down: "Vendendo menos",
};

export const POSITION_TEXTS: Record<PricePosition, string> = {
  none: "Você ainda não definiu o seu preço.",
  above: "Seu preço está acima da média dos produtores.",
  near: "Seu preço está na média dos produtores.",
  below: "Seu preço está abaixo da média dos produtores.",
};

export const ADVICE_TEXTS: Record<PriceAdvice, string> = {
  setPrice: "Defina o seu preço no Catálogo para comparar com o mercado.",
  lower: "Baixar um pouco o preço pode ajudar a vender mais.",
  raise: "Está vendendo bem com preço abaixo da média: dá para subir um pouco.",
  keep: "Mantenha o preço por enquanto.",
};

// Variação das vendas para mostrar ao lado do selo: +25%, -12%. Sem período anterior não há o que mostrar.
export function changeLabel(change: number | null): string {
  if (change === null) return "";
  const percent = Math.round(change * 100);
  if (percent === 0) return "0%";
  return `${percent > 0 ? "+" : "-"}${Math.abs(percent)}%`;
}
