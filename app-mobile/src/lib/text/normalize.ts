// Texto sem acento, em minúsculas e sem espaços nas pontas: base de toda busca e comparação de nomes.
export function normalizeText(text: string): string {
  const base = typeof text.normalize === "function" ? text.normalize("NFD") : text;
  return base.replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

// Busca vazia acha tudo.
export function includesText(text: string, query: string): boolean {
  const needle = normalizeText(query);
  return needle === "" || normalizeText(text).includes(needle);
}
