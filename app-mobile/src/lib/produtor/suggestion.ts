import type { ProductSuggestion } from "@/types/produtor";

// Aceita vírgula ou ponto no preço; a API recebe sempre com ponto.
export function normalizePrice(text: string): string {
  return text.trim().replace(",", ".");
}

export function validateSuggestion(suggestion: ProductSuggestion): string | null {
  if (!suggestion.nomeProduto.trim()) return "Dê um nome ao produto.";

  const price = normalizePrice(suggestion.precoSugerido);
  if (price !== "" && !(Number(price) > 0)) return "Informe um preço válido, como 8,50.";

  return null;
}
