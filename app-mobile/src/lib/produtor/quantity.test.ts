import { clampQuantity, positionFraction, valueFromPosition } from "./quantity";

describe("clampQuantity", () => {
  it("mantém o que cabe e corta no máximo", () => {
    expect(clampQuantity(5, 10)).toBe(5);
    expect(clampQuantity(50, 10)).toBe(10);
  });

  it("não deixa ficar negativo e arredonda para baixo", () => {
    expect(clampQuantity(-3, 10)).toBe(0);
    expect(clampQuantity(4.9, 10)).toBe(4);
  });

  it("valor que não é número vira zero", () => {
    expect(clampQuantity(Number.NaN, 10)).toBe(0);
    expect(clampQuantity(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });
});

describe("slider de quantidade", () => {
  it("o toque leva ao valor mais perto, de 0 ao máximo", () => {
    expect(valueFromPosition(0, 200, 40)).toBe(0);
    expect(valueFromPosition(100, 200, 40)).toBe(20);
    expect(valueFromPosition(200, 200, 40)).toBe(40);
    expect(valueFromPosition(51, 200, 40)).toBe(10);
  });

  it("fora da barra fica nos limites e sem largura não quebra", () => {
    expect(valueFromPosition(-30, 200, 40)).toBe(0);
    expect(valueFromPosition(900, 200, 40)).toBe(40);
    expect(valueFromPosition(50, 0, 40)).toBe(0);
  });

  it("a posição do valor é a conta inversa, em fração da barra", () => {
    expect(positionFraction(0, 40)).toBe(0);
    expect(positionFraction(10, 40)).toBe(0.25);
    expect(positionFraction(40, 40)).toBe(1);
    expect(positionFraction(60, 40)).toBe(1);
    expect(positionFraction(5, 0)).toBe(0);
  });
});
