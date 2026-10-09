import { ADVICE_TEXTS, changeLabel, POSITION_TEXTS, SALES_SIGNAL_LABELS } from "./priceTexts";

describe("textos de preço e venda", () => {
  it("tem texto para cada situação", () => {
    expect(Object.keys(SALES_SIGNAL_LABELS).sort()).toEqual(["down", "steady", "up"]);
    expect(Object.keys(POSITION_TEXTS).sort()).toEqual(["above", "below", "near", "none"]);
    expect(Object.keys(ADVICE_TEXTS).sort()).toEqual(["keep", "lower", "raise", "setPrice"]);
  });

  it("mostra a variação das vendas em porcentagem", () => {
    expect(changeLabel(0.25)).toBe("+25%");
    expect(changeLabel(-0.123)).toBe("-12%");
    expect(changeLabel(0)).toBe("0%");
    expect(changeLabel(0.001)).toBe("0%");
  });

  it("sem período anterior não mostra variação", () => {
    expect(changeLabel(null)).toBe("");
  });
});
