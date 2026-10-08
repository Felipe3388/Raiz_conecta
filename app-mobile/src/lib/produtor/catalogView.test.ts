import type { CatalogProduct } from "@/types/produtor";
import { applyCatalogView, catalogCounts, DEFAULT_CATALOG_VIEW } from "./catalogView";

function product(cdProduto: number, nome: string): CatalogProduct {
  return { cdProduto, nome, tipo: "Fruta", imagemUrl: null, unidadePadrao: "Kg" };
}

const PRODUCTS = [product(1, "Tomate"), product(2, "Maçã"), product(3, "Água de coco"), product(4, "Banana")];
const names = (list: CatalogProduct[]) => list.map((p) => p.nome);

describe("applyCatalogView", () => {
  it("visão padrão mantém a ordem do catálogo e mostra tudo", () => {
    expect(names(applyCatalogView(PRODUCTS, [], DEFAULT_CATALOG_VIEW))).toEqual(names(PRODUCTS));
  });

  it("busca ignora acento e maiúsculas", () => {
    const view = { ...DEFAULT_CATALOG_VIEW, query: "MACA" };
    expect(names(applyCatalogView(PRODUCTS, [], view))).toEqual(["Maçã"]);
  });

  it("filtra só os selecionados", () => {
    const view = { ...DEFAULT_CATALOG_VIEW, filter: "selected" as const };
    expect(names(applyCatalogView(PRODUCTS, [1, 4], view))).toEqual(["Tomate", "Banana"]);
  });

  it("filtra só os não selecionados", () => {
    const view = { ...DEFAULT_CATALOG_VIEW, filter: "unselected" as const };
    expect(names(applyCatalogView(PRODUCTS, [1, 4], view))).toEqual(["Maçã", "Água de coco"]);
  });

  it("ordena de A a Z sem se confundir com acento", () => {
    const view = { ...DEFAULT_CATALOG_VIEW, sort: "nameAsc" as const };
    expect(names(applyCatalogView(PRODUCTS, [], view))).toEqual(["Água de coco", "Banana", "Maçã", "Tomate"]);
  });

  it("ordena de Z a A", () => {
    const view = { ...DEFAULT_CATALOG_VIEW, sort: "nameDesc" as const };
    expect(names(applyCatalogView(PRODUCTS, [], view))).toEqual(["Tomate", "Maçã", "Banana", "Água de coco"]);
  });

  it("combina busca, filtro e ordem", () => {
    const view = { query: "a", filter: "unselected" as const, sort: "nameDesc" as const };
    expect(names(applyCatalogView(PRODUCTS, [1], view))).toEqual(["Maçã", "Banana", "Água de coco"]);
  });

  it("não altera a lista original", () => {
    const copy = [...PRODUCTS];
    applyCatalogView(PRODUCTS, [], { ...DEFAULT_CATALOG_VIEW, sort: "nameDesc" });
    expect(PRODUCTS).toEqual(copy);
  });
});

describe("catalogCounts", () => {
  it("conta todos, selecionados e não selecionados", () => {
    expect(catalogCounts(PRODUCTS, [1, 2], "")).toEqual({ all: 4, selected: 2, unselected: 2 });
  });

  it("os números acompanham a busca, para bater com o que a pessoa vai ver", () => {
    // "o" aparece só em Tomate (selecionado) e Água de coco (não selecionado).
    expect(catalogCounts(PRODUCTS, [1, 2], "o")).toEqual({ all: 2, selected: 1, unselected: 1 });
  });

  it("ignora ids que não estão no catálogo", () => {
    expect(catalogCounts(PRODUCTS, [99], "")).toEqual({ all: 4, selected: 0, unselected: 4 });
  });
});
