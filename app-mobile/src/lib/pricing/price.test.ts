import { formatPriceInput, MAX_PRICE, parsePrice, priceKey, roundCents } from "./price";

describe("parsePrice", () => {
  it.each([
    ["3", 3],
    ["3,5", 3.5],
    ["3.50", 3.5],
    ["R$ 3,50", 3.5],
    ["  12,9  ", 12.9],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["1.234", 1234],
  ])("entende %p como %p", (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it("arredonda para centavos", () => {
    expect(parsePrice("3,456")).toBe(3.46);
  });

  it.each(["", "abc", "0", "0,00", "-2", "3,5,5", "R$"])("recusa %p", (text) => {
    expect(parsePrice(text)).toBeNull();
  });

  it("recusa preço acima do limite", () => {
    expect(parsePrice(String(MAX_PRICE + 1))).toBeNull();
    expect(parsePrice(String(MAX_PRICE))).toBe(MAX_PRICE);
  });
});

describe("formatPriceInput", () => {
  it("escreve com vírgula e duas casas, para preencher o campo", () => {
    expect(formatPriceInput(3.5)).toBe("3,50");
    expect(formatPriceInput(45)).toBe("45,00");
  });
});

describe("roundCents", () => {
  it("arredonda para centavos sem erro de ponto flutuante", () => {
    expect(roundCents(1.005 + 0.0000001)).toBe(1.01);
    expect(roundCents(2.999)).toBe(3);
  });
});

describe("priceKey", () => {
  it("ignora acento, maiúscula e espaços para juntar o mesmo produto", () => {
    expect(priceKey(" Maçã ")).toBe(priceKey("maca"));
  });
});
