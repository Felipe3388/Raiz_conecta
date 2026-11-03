import { describe, expect, it } from "vitest";
import { parseQuantity, stepQuantity } from "./quantity";

describe("quantidade digitada", () => {
  it("entende números, arredonda para baixo e respeita os limites", () => {
    expect(parseQuantity("12", 1, 100)).toBe(12);
    expect(parseQuantity("12,9", 1, 100)).toBe(12);
    expect(parseQuantity("0", 1, 100)).toBe(1);
    expect(parseQuantity("500", 1, 100)).toBe(100);
  });

  it("vazio ou texto não vira número", () => {
    expect(parseQuantity("", 1, 100)).toBeNull();
    expect(parseQuantity("abc", 1, 100)).toBeNull();
  });

  it("os botões + e − não passam dos limites", () => {
    expect(stepQuantity(1, -1, 1, 10)).toBe(1);
    expect(stepQuantity(10, 1, 1, 10)).toBe(10);
    expect(stepQuantity(4, 1, 1, 10)).toBe(5);
  });
});
