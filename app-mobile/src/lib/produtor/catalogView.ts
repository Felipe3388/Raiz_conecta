import { includesText, normalizeText } from "@/lib/text/normalize";
import type { CatalogProduct } from "@/types/produtor";

export type CatalogFilter = "all" | "selected" | "unselected";
// "default" mantém a ordem do catálogo do site.
export type CatalogSort = "default" | "nameAsc" | "nameDesc";
// Grade com fotos grandes ou lista compacta ("Detalhes") para ver mais produtos de uma vez.
export type CatalogLayout = "grid" | "details";

export interface CatalogView {
  query: string;
  filter: CatalogFilter;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_VIEW: CatalogView = { query: "", filter: "all", sort: "default" };

const byName = (a: CatalogProduct, b: CatalogProduct) => {
  const left = normalizeText(a.nome);
  const right = normalizeText(b.nome);
  return left < right ? -1 : left > right ? 1 : 0;
};

export function applyCatalogView(
  products: CatalogProduct[],
  selectedIds: number[],
  view: CatalogView,
): CatalogProduct[] {
  const selected = new Set(selectedIds);
  const visible = products.filter((product) => {
    if (!includesText(product.nome, view.query)) return false;
    if (view.filter === "selected") return selected.has(product.cdProduto);
    if (view.filter === "unselected") return !selected.has(product.cdProduto);
    return true;
  });

  if (view.sort === "nameAsc") return [...visible].sort(byName);
  if (view.sort === "nameDesc") return [...visible].sort((a, b) => byName(b, a));
  return visible;
}

export interface CatalogCounts {
  all: number;
  selected: number;
  unselected: number;
}

// Os números acompanham a busca: o que está no filtro é o que a pessoa vai ver.
export function catalogCounts(
  products: CatalogProduct[],
  selectedIds: number[],
  query: string,
): CatalogCounts {
  const selected = new Set(selectedIds);
  const matching = products.filter((product) => includesText(product.nome, query));
  const selectedCount = matching.filter((product) => selected.has(product.cdProduto)).length;
  return { all: matching.length, selected: selectedCount, unselected: matching.length - selectedCount };
}
