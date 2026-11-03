import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, categoriesOf, categoryIcon, filterProducts, NO_FILTERS, type CatalogProduct } from "./catalog";

const p = (cdProduto: number, nome: string, tipo: string, preco: number): CatalogProduct => ({ cdProduto, nome, tipo, preco, unidadePadrao: "Kg", imagemUrl: null });
const products = [p(1, "Maçã Fuji", "Frutas", 6), p(2, "Alface", "Verduras", 2), p(3, "Cenoura", "Legumes", 4), p(4, "Banana", "Frutas", 3)];

describe("filterProducts", () => {
  it("ordena de A a Z por padrão", () => {
    expect(filterProducts(products, NO_FILTERS).map((x) => x.nome)).toEqual(["Alface", "Banana", "Cenoura", "Maçã Fuji"]);
  });
  it("busca sem diferenciar acento nem maiúsculas", () => {
    expect(filterProducts(products, { ...NO_FILTERS, query: "maca" }).map((x) => x.nome)).toEqual(["Maçã Fuji"]);
    expect(filterProducts(products, { ...NO_FILTERS, query: "  ALFA " })).toHaveLength(1);
  });
  it("filtra por categoria e ordena por preço", () => {
    const frutas = filterProducts(products, { query: "", category: "Frutas", sort: "preco_asc" });
    expect(frutas.map((x) => x.nome)).toEqual(["Banana", "Maçã Fuji"]);
    expect(filterProducts(products, { query: "", category: ALL_CATEGORIES, sort: "preco_desc" })[0].nome).toBe("Maçã Fuji");
  });
  it("não altera a lista original", () => {
    const copy = [...products];
    filterProducts(products, { ...NO_FILTERS, sort: "preco_desc" });
    expect(products).toEqual(copy);
  });
});

describe("categoriesOf / categoryIcon", () => {
  it("lista as categorias existentes, sem repetir, com 'Todas' na frente", () => {
    expect(categoriesOf(products)).toEqual(["Todas", "Frutas", "Legumes", "Verduras"]);
  });
  it("tem um desenho para cada categoria e um padrão", () => {
    expect(categoryIcon("Frutas")).toBe("🍎");
    expect(categoryIcon("Outros")).toBe("📦");
    expect(categoryIcon(null)).toBe("📦");
  });
});
