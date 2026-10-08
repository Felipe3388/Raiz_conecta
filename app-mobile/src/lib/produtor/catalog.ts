import { includesText } from "@/lib/text/normalize";
import type { CatalogProduct } from "@/types/produtor";

export function toggleProductId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

export function filterProducts(products: CatalogProduct[], query: string): CatalogProduct[] {
  return products.filter((product) => includesText(product.nome, query));
}

export function selectedProductNames(products: CatalogProduct[], ids: number[]): string[] {
  return products.filter((product) => ids.includes(product.cdProduto)).map((product) => product.nome);
}

// Compara as escolhas salvas com as atuais, sem se importar com a ordem.
export function hasSelectionChanged(saved: number[], current: number[]): boolean {
  if (saved.length !== current.length) return true;
  const savedSet = new Set(saved);
  return current.some((id) => !savedSet.has(id));
}
