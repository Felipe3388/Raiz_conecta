import { formatDateBR } from "./date";

describe("formatDateBR", () => {
  it("escreve dia, mês e ano com zero à esquerda", () => {
    expect(formatDateBR(new Date(2026, 9, 6, 12).toISOString())).toBe("06/10/2026");
    expect(formatDateBR(new Date(2026, 0, 31, 12).toISOString())).toBe("31/01/2026");
  });

  it("data inválida vira um traço, sem quebrar a tela", () => {
    expect(formatDateBR("não é data")).toBe("—");
    expect(formatDateBR("")).toBe("—");
  });
});
