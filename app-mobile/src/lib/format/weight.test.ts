import { formatKg, formatKgInput, formatPercent, formatSignedKg } from "./weight";

describe("formatKg", () => {
  it("vírgula decimal, sem zeros sobrando", () => {
    expect(formatKg(9.88)).toBe("9,88 kg");
    expect(formatKg(10)).toBe("10 kg");
    expect(formatKg(12.5)).toBe("12,5 kg");
    expect(formatKg(0.3)).toBe("0,3 kg");
  });

  it("até três casas (gramas) e milhar com ponto", () => {
    expect(formatKg(1.2345)).toBe("1,235 kg");
    expect(formatKg(1234.5)).toBe("1.234,5 kg");
    expect(formatKg(800)).toBe("800 kg");
  });

  it("valor inválido vira 0 kg", () => {
    expect(formatKg(Number.NaN)).toBe("0 kg");
    expect(formatKg(-0)).toBe("0 kg");
  });
});

describe("formatSignedKg (quanto falta ou sobra)", () => {
  it("sinal explícito", () => {
    expect(formatSignedKg(1.5)).toBe("+1,5 kg");
    expect(formatSignedKg(-0.12)).toBe("−0,12 kg");
    expect(formatSignedKg(0)).toBe("0 kg");
  });
});

describe("formatPercent", () => {
  it("uma casa, só se precisar", () => {
    expect(formatPercent(10)).toBe("10%");
    expect(formatPercent(-1.2)).toBe("−1,2%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatKgInput (para preencher o campo)", () => {
  it("vírgula e sem a unidade", () => {
    expect(formatKgInput(9.88)).toBe("9,88");
    expect(formatKgInput(10)).toBe("10");
  });
});
