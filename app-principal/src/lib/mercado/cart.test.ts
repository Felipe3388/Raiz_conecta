import { describe, expect, it } from "vitest";
import { addToCart, cartTotal, parseStoredCart, reconcile, removeItem, setQuantity, toRequest, type CartProduct } from "./cart";

const maca: CartProduct = { cdProduto: 1, nome: "Maçã", preco: 5.5, unidadePadrao: "Kg", imagemUrl: null };
const alface: CartProduct = { cdProduto: 2, nome: "Alface", preco: 2, unidadePadrao: "Maço", imagemUrl: "https://res.cloudinary.com/x.jpg" };

describe("cesta", () => {
  it("junta a mesma mercadoria em um item só", () => {
    const cart = addToCart(addToCart([], maca, 2), maca, 3);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ id: 1, nome: "Maçã", preco: 5.5, unidade: "Kg", qtd: 5 });
  });

  it("limita a quantidade e nunca deixa menos que 1", () => {
    expect(addToCart([], maca, 0)[0].qtd).toBe(1);
    expect(addToCart([], maca, 9_999_999)[0].qtd).toBe(100_000);
    expect(addToCart([], maca, 2.9)[0].qtd).toBe(2);
  });

  it("quantidade menor que 1 tira o item", () => {
    const cart = addToCart(addToCart([], maca, 2), alface, 1);
    expect(setQuantity(cart, 1, 0).map((i) => i.id)).toEqual([2]);
    expect(setQuantity(cart, 1, 7).find((i) => i.id === 1)?.qtd).toBe(7);
    expect(setQuantity(cart, 1, Number.NaN).map((i) => i.id)).toEqual([2]);
    expect(removeItem(cart, 2).map((i) => i.id)).toEqual([1]);
  });

  it("soma o total em reais sem erro de arredondamento", () => {
    const cart = addToCart(addToCart([], { ...maca, preco: 0.1 }, 3), { ...alface, preco: 0.2 }, 1);
    expect(cartTotal(cart)).toBe(0.5);
    expect(cartTotal([])).toBe(0);
  });

  it("manda ao servidor só o id e a quantidade", () => {
    expect(toRequest(addToCart([], maca, 4))).toEqual({ carrinho: [{ id: 1, qtd: 4 }] });
  });
});

describe("parseStoredCart", () => {
  it("lê o formato novo e o antigo (precoEstimado)", () => {
    const cart = parseStoredCart(JSON.stringify([
      { id: 1, nome: "Maçã", preco: 5.5, unidade: "Kg", qtd: 2 },
      { id: 2, nome: "Alface", precoEstimado: 2, qtd: 3, icone: "🥬", imagemUrl: "https://res.cloudinary.com/x.jpg" },
    ]));
    expect(cart).toEqual([
      { id: 1, nome: "Maçã", preco: 5.5, unidade: "Kg", imagemUrl: null, qtd: 2 },
      { id: 2, nome: "Alface", preco: 2, unidade: "Kg", imagemUrl: "https://res.cloudinary.com/x.jpg", qtd: 3 },
    ]);
  });

  it("descarta lixo sem quebrar", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("{não é json")).toEqual([]);
    expect(parseStoredCart('{"id":1}')).toEqual([]);
    expect(parseStoredCart(JSON.stringify([null, { id: "x", qtd: 1 }, { id: 3, qtd: 0 }, { id: 4, qtd: 2, preco: -5 }]))).toEqual([
      { id: 4, nome: "Produto", preco: 0, unidade: "Kg", imagemUrl: null, qtd: 2 },
    ]);
  });

  it("repetido vira um só", () => {
    expect(parseStoredCart(JSON.stringify([{ id: 1, qtd: 1 }, { id: 1, qtd: 5 }]))).toHaveLength(1);
  });
});

describe("reconcile", () => {
  it("tira o que saiu do catálogo e atualiza preços", () => {
    const cart = addToCart(addToCart([], maca, 2), alface, 1);
    const result = reconcile(cart, [{ ...maca, preco: 6 }]);

    expect(result.removed).toEqual(["Alface"]);
    expect(result.repriced).toBe(true);
    expect(result.cart).toEqual([expect.objectContaining({ id: 1, preco: 6, qtd: 2 })]);
  });

  it("sem mudança, nada é avisado", () => {
    const cart = addToCart([], maca, 2);
    expect(reconcile(cart, [maca])).toEqual({ cart, removed: [], repriced: false });
  });
});
