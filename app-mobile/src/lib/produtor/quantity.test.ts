import { clampQuantity } from "./quantity";

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
