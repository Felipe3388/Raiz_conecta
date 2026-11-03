import type { CartProduct } from "./cart";

// A vitrine do mercado: busca, categoria e ordem. Funções puras.

export interface CatalogProduct extends CartProduct {
  descricao?: string | null;
}

export type SortKey = "nome" | "preco_asc" | "preco_desc";
export interface CatalogFilters {
  query: string;
  category: string;
  sort: SortKey;
}

export const ALL_CATEGORIES = "Todas";
export const NO_FILTERS: CatalogFilters = { query: "", category: ALL_CATEGORIES, sort: "nome" };

// Sem acento e sem maiúsculas: "maca" encontra "Maçã".
const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function categoriesOf(products: CatalogProduct[]): string[] {
  return [ALL_CATEGORIES, ...[...new Set(products.map((product) => product.tipo).filter((tipo): tipo is string => Boolean(tipo)))].sort((a, b) => a.localeCompare(b, "pt-BR"))];
}

export function filterProducts(products: CatalogProduct[], { query, category, sort }: CatalogFilters): CatalogProduct[] {
  const needle = plain(query.trim());
  return products
    .filter((product) => (!needle || plain(product.nome ?? "").includes(needle)) && (category === ALL_CATEGORIES || product.tipo === category))
    .sort((a, b) => {
      if (sort === "preco_asc") return (a.preco ?? 0) - (b.preco ?? 0);
      if (sort === "preco_desc") return (b.preco ?? 0) - (a.preco ?? 0);
      return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
    });
}

const ICONS: Record<string, string> = { Frutas: "🍎", Verduras: "🥬", Legumes: "🥕", Grãos: "🌾" };

// O desenho que aparece quando o produto não tem foto.
export function categoryIcon(tipo: string | null | undefined): string {
  return (tipo && ICONS[tipo]) || "📦";
}
