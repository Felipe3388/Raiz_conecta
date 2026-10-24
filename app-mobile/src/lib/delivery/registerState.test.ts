import { canRegister, registerState } from "./registerState";

const base = { hasWeight: true, irregular: false, holding: false, verdict: "NA_FAIXA" } as const;

describe("registerState", () => {
  it("sem peso, o botão fica vazio", () => {
    expect(registerState({ ...base, hasWeight: false, verdict: "SEM_PESO" })).toBe("empty");
  });

  it("peso oscilando é carga irregular, mesmo sem peso estável ainda", () => {
    expect(registerState({ ...base, hasWeight: false, irregular: true, verdict: "SEM_PESO" })).toBe("irregular");
    expect(registerState({ ...base, irregular: true })).toBe("irregular");
  });

  it("peso parado mas dentro da contagem de 5 s aguarda", () => {
    expect(registerState({ ...base, holding: true })).toBe("holding");
  });

  it("abaixo do mínimo e acima do máximo bloqueiam", () => {
    expect(registerState({ ...base, verdict: "ABAIXO" })).toBe("below");
    expect(registerState({ ...base, verdict: "ACIMA" })).toBe("above");
  });

  it("dentro da faixa, pronto para registrar", () => {
    expect(registerState(base)).toBe("ready");
    expect(canRegister("ready")).toBe(true);
  });

  it("só o estado pronto deixa registrar", () => {
    for (const state of ["empty", "irregular", "holding", "below", "above"] as const) {
      expect(canRegister(state)).toBe(false);
    }
  });
});
