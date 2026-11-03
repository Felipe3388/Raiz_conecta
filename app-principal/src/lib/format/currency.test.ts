import { describe, expect, it } from "vitest";
import { formatBRL, formatQuantity } from "./currency";

describe("formatBRL", () => {
  it("usa vírgula, ponto de milhar e espaço comum", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });
  it("valor inválido vira zero", () => {
    expect(formatBRL(NaN)).toBe("R$ 0,00");
  });
});

describe("formatQuantity", () => {
  it("separa milhar e junta a unidade", () => {
    expect(formatQuantity(1250, "Kg")).toBe("1.250 Kg");
    expect(formatQuantity(1, "Kg")).toBe("1 Kg");
  });
});
