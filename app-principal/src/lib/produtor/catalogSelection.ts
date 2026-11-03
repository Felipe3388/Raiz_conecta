// A escolha do produtor no Catálogo: quais produtos ele vende e, para cada um, o preço por kg (opcional).
// O preço fica como texto enquanto a pessoa digita ("8,50") e só vira número ao salvar.
export type Selection = Map<number, string>;

export interface SavedItem {
  cdProduto: number;
  preco: number | null;
}

export function fromSaved(saved: SavedItem[]): Selection {
  return new Map(saved.map((item) => [item.cdProduto, item.preco === null ? "" : formatPrice(item.preco)]));
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

// "8,50" e " 8 " viram número ("1.234,50": o ponto é milhar); vazio vira null (sem preço); lixo vira NaN.
// Passe antes por normalizePriceText, para "8.5" valer 8,5.
export function parsePriceText(text: string): number | null {
  const clean = text.trim().replace(/\./g, "").replace(",", ".");
  if (clean === "") return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : Number.NaN;
}

// "8.5" digitado com ponto vale 8,5 (e não 85): só o ponto seguido de 3 dígitos é milhar, como em "1.234,50".
export function normalizePriceText(text: string): string {
  const trimmed = text.trim();
  if (/^\d+\.\d{1,2}$/.test(trimmed)) return trimmed.replace(".", ",");
  return trimmed;
}

export function toggle(selection: Selection, cdProduto: number): Selection {
  const next = new Map(selection);
  if (next.has(cdProduto)) next.delete(cdProduto);
  else next.set(cdProduto, "");
  return next;
}

export function setPrice(selection: Selection, cdProduto: number, text: string): Selection {
  if (!selection.has(cdProduto)) return selection;
  const next = new Map(selection);
  next.set(cdProduto, text);
  return next;
}

// Mensagem de erro de um preço digitado (null = ok ou vazio).
export function priceError(text: string): string | null {
  const value = parsePriceText(normalizePriceText(text));
  if (value === null) return null;
  if (Number.isNaN(value) || value <= 0) return "Informe um preço maior que zero.";
  if (value > 100000) return "Preço alto demais. Confira o valor.";
  return null;
}

export function firstPriceError(selection: Selection): string | null {
  for (const text of selection.values()) {
    const error = priceError(text);
    if (error) return error;
  }
  return null;
}

// O corpo do POST /api/produtor/meus-produtos: só manda preço quando a pessoa preencheu.
export function buildPayload(selection: Selection): { produtos: { cdProduto: number; preco?: number }[] } {
  const produtos = [...selection.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cdProduto, text]) => {
      const value = parsePriceText(normalizePriceText(text));
      return value === null || Number.isNaN(value) ? { cdProduto } : { cdProduto, preco: Math.round(value * 100) / 100 };
    });
  return { produtos };
}

// Mudou alguma coisa desde o que está salvo? (escolha ou preço)
export function isDirty(saved: Selection, current: Selection): boolean {
  if (saved.size !== current.size) return true;
  for (const [id, text] of current) {
    if (!saved.has(id)) return true;
    const before = parsePriceText(normalizePriceText(saved.get(id) ?? ""));
    const now = parsePriceText(normalizePriceText(text));
    if (!(before === now || (Number.isNaN(before) && Number.isNaN(now)))) return true;
  }
  return false;
}
