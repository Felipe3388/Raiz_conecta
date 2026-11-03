import { describe, expect, it } from "vitest";
import {
  buildPayload,
  firstPriceError,
  fromSaved,
  isDirty,
  normalizePriceText,
  parsePriceText,
  priceError,
  setPrice,
  toggle,
} from "./catalogSelection";

describe("parsePriceText", () => {
  it.each([
    ["8,50", 8.5],
    ["8.5", 8.5],
    [" 8 ", 8],
    ["1.234,50", 1234.5],
    ["", null],
    ["   ", null],
  ])("%p vira %p", (text, value) => {
    expect(parsePriceText(normalizePriceText(text))).toBe(value);
  });

  it("texto que não é número vira NaN", () => {
    expect(parsePriceText("abc")).toBeNaN();
  });
});

describe("priceError", () => {
  it("vazio e preço normal passam", () => {
    expect(priceError("")).toBeNull();
    expect(priceError("9,90")).toBeNull();
  });
  it("zero, negativo, lixo e exagero recebem mensagem", () => {
    expect(priceError("0")).toBe("Informe um preço maior que zero.");
    expect(priceError("-3")).toBe("Informe um preço maior que zero.");
    expect(priceError("abc")).toBe("Informe um preço maior que zero.");
    expect(priceError("999999")).toBe("Preço alto demais. Confira o valor.");
  });
  it("firstPriceError acha o primeiro problema da lista", () => {
    expect(firstPriceError(new Map([[1, "5"], [2, "x"]]))).toBe("Informe um preço maior que zero.");
    expect(firstPriceError(new Map([[1, "5"], [2, ""]]))).toBeNull();
  });
});

describe("seleção", () => {
  it("marcar e desmarcar um produto", () => {
    const one = toggle(new Map(), 4);
    expect([...one.keys()]).toEqual([4]);
    expect(toggle(one, 4).size).toBe(0);
  });

  it("não muda a seleção original", () => {
    const start = new Map([[1, ""]]);
    toggle(start, 2);
    setPrice(start, 1, "9");
    expect(start.get(1)).toBe("");
  });

  it("preço só entra em produto marcado", () => {
    expect(setPrice(new Map(), 9, "5").size).toBe(0);
  });

  it("fromSaved mostra o preço salvo em formato brasileiro", () => {
    const selection = fromSaved([{ cdProduto: 1, preco: 8.5 }, { cdProduto: 2, preco: null }]);
    expect(selection.get(1)).toBe("8,50");
    expect(selection.get(2)).toBe("");
  });
});

describe("buildPayload", () => {
  it("manda o preço só de quem preencheu, em ordem de código", () => {
    const payload = buildPayload(new Map([[7, "10"], [2, ""], [5, "8,5"]]));
    expect(payload).toEqual({ produtos: [{ cdProduto: 2 }, { cdProduto: 5, preco: 8.5 }, { cdProduto: 7, preco: 10 }] });
  });
  it("seleção vazia manda lista vazia (limpa o catálogo)", () => {
    expect(buildPayload(new Map())).toEqual({ produtos: [] });
  });
});

describe("isDirty", () => {
  const saved = fromSaved([{ cdProduto: 1, preco: 8.5 }, { cdProduto: 2, preco: null }]);

  it("igual ao salvo não está sujo, mesmo escrito de outro jeito", () => {
    expect(isDirty(saved, new Map(saved))).toBe(false);
    expect(isDirty(saved, new Map([[1, "8.5"], [2, ""]]))).toBe(false);
  });
  it("produto a mais, a menos ou preço diferente está sujo", () => {
    expect(isDirty(saved, toggle(saved, 3))).toBe(true);
    expect(isDirty(saved, toggle(saved, 2))).toBe(true);
    expect(isDirty(saved, setPrice(saved, 1, "9"))).toBe(true);
    expect(isDirty(saved, setPrice(saved, 2, "3"))).toBe(true);
  });
});
