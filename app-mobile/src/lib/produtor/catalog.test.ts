import type { CatalogProduct } from "@/types/produtor";
import {
  filterProducts,
  hasSelectionChanged,
  selectedProductNames,
  toggleProductId,
} from "./catalog";

function product(cdProduto: number, nome: string): CatalogProduct {
  return { cdProduto, nome, tipo: "Fruta", imagemUrl: null, unidadePadrao: "Kg" };
}

const catalog = [product(1, "Tomate"), product(2, "Maçã"), product(3, "Alface")];

describe("toggleProductId", () => {
  it("marca um produto novo", () => {
    expect(toggleProductId([1], 2)).toEqual([1, 2]);
  });

  it("desmarca um produto já marcado", () => {
    expect(toggleProductId([1, 2], 1)).toEqual([2]);
  });

  it("não altera a lista original", () => {
    const ids = [1];
    toggleProductId(ids, 2);
    expect(ids).toEqual([1]);
  });
});

describe("filterProducts", () => {
  it("busca pelo nome sem diferenciar acento nem caixa", () => {
    expect(filterProducts(catalog, "MACA").map((p) => p.nome)).toEqual(["Maçã"]);
  });

  it("busca vazia devolve o catálogo todo", () => {
    expect(filterProducts(catalog, "  ")).toHaveLength(3);
  });
});

describe("selectedProductNames", () => {
  it("devolve os nomes dos produtos marcados", () => {
    expect(selectedProductNames(catalog, [3, 1])).toEqual(["Tomate", "Alface"]);
  });

  it("ignora ids que não estão no catálogo", () => {
    expect(selectedProductNames(catalog, [99])).toEqual([]);
  });
});

describe("hasSelectionChanged", () => {
  it("é falso quando as listas têm os mesmos itens, em qualquer ordem", () => {
    expect(hasSelectionChanged([1, 2, 3], [3, 1, 2])).toBe(false);
  });

  it("é verdadeiro quando entra ou sai um produto", () => {
    expect(hasSelectionChanged([1, 2], [1, 2, 3])).toBe(true);
    expect(hasSelectionChanged([1, 2], [1])).toBe(true);
    expect(hasSelectionChanged([1, 2], [1, 4])).toBe(true);
  });
});
