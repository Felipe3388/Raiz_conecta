import { formatBRL } from "./currency";

describe("formatBRL", () => {
  it.each([
    [4.5, "R$ 4,50"],
    [0, "R$ 0,00"],
    [12, "R$ 12,00"],
    [1234.5, "R$ 1.234,50"],
    [1234567.891, "R$ 1.234.567,89"],
    [0.1 + 0.2, "R$ 0,30"],
  ])("formata %p como %p", (value, expected) => {
    expect(formatBRL(value)).toBe(expected);
  });

  it("trata valor ausente ou inválido como zero", () => {
    expect(formatBRL(null)).toBe("R$ 0,00");
    expect(formatBRL(undefined)).toBe("R$ 0,00");
    expect(formatBRL(Number.NaN)).toBe("R$ 0,00");
  });
});
