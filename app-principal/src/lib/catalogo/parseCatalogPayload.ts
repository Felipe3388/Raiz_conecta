import type { CatalogItem } from "./types";

export type ParseResult =
  | { ok: true; items: CatalogItem[] }
  | { ok: false; error: string };

const INVALID_PRODUCT = "Código de produto inválido.";

// Aceita o formato novo { produtos: [{ cdProduto, preco? }] } e o antigo { produtosIds: [..] },
// que o site ainda usa.
export function parseCatalogPayload(body: unknown): ParseResult {
  if (!isRecord(body)) return fail("Corpo da requisição inválido.");

  const hasProdutos = "produtos" in body;
  const hasProdutosIds = "produtosIds" in body;

  if (hasProdutos && hasProdutosIds) return fail("Envie apenas produtos ou produtosIds.");

  const list = hasProdutos ? body.produtos : body.produtosIds;
  if (!Array.isArray(list)) return fail("Informe a lista de produtos.");

  const items: CatalogItem[] = [];
  for (const entry of list) {
    const parsed = hasProdutos ? parseEntry(entry) : parseId(entry);
    if (!parsed.ok) return parsed;
    items.push(parsed.item);
  }

  return { ok: true, items: mergeDuplicates(items) };
}

type EntryResult = { ok: true; item: CatalogItem } | { ok: false; error: string };

function parseId(value: unknown): EntryResult {
  if (!isProductCode(value)) return fail(INVALID_PRODUCT);
  return { ok: true, item: { cdProduto: value } };
}

function parseEntry(entry: unknown): EntryResult {
  if (!isRecord(entry) || !isProductCode(entry.cdProduto)) return fail(INVALID_PRODUCT);

  const { cdProduto } = entry;
  if (entry.preco === undefined) return { ok: true, item: { cdProduto } };

  const preco = parsePrice(entry.preco);
  if (preco === null) return fail(`Preço inválido para o produto ${cdProduto}.`);

  return { ok: true, item: { cdProduto, preco } };
}

function parsePrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded > 0 ? rounded : null;
}

// Produto repetido vira um só item; o último preço informado vence.
function mergeDuplicates(items: CatalogItem[]): CatalogItem[] {
  const merged = new Map<number, CatalogItem>();

  for (const { cdProduto, preco } of items) {
    const finalPrice = preco ?? merged.get(cdProduto)?.preco;
    merged.set(cdProduto, finalPrice === undefined ? { cdProduto } : { cdProduto, preco: finalPrice });
  }

  return [...merged.values()];
}

function isProductCode(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
