import { isValidPassword, passwordRequirements, passwordStrength } from "./password";

describe("isValidPassword", () => {
  it("aceita senha com 8+ caracteres, maiúscula, minúscula, número e símbolo", () => {
    expect(isValidPassword("Senha@123")).toBe(true);
  });

  it.each([
    ["curta", "Ab1!"],
    ["sem maiúscula", "senha@123"],
    ["sem minúscula", "SENHA@123"],
    ["sem número", "Senha@abc"],
    ["sem símbolo", "Senha1234"],
  ])("recusa senha %s", (_motivo, senha) => {
    expect(isValidPassword(senha)).toBe(false);
  });
});

describe("passwordStrength", () => {
  it.each([
    ["", { score: 0, label: "Muito fraca" }],
    ["abc", { score: 0, label: "Muito fraca" }],
    ["abcdefgh", { score: 1, label: "Muito fraca" }],
    ["Abcdefgh", { score: 2, label: "Fraca" }],
    ["Abcdefg1", { score: 3, label: "Razoável" }],
    ["Abcdef1!", { score: 4, label: "Forte" }],
    ["Abcdefgh12!@", { score: 5, label: "Muito forte" }],
  ])("senha %p", (senha, expected) => {
    expect(passwordStrength(senha)).toEqual(expected);
  });
});

describe("passwordRequirements", () => {
  it("lista os cinco requisitos na ordem, todos pendentes para senha vazia", () => {
    const requirements = passwordRequirements("");

    expect(requirements.map((r) => r.label)).toEqual([
      "Pelo menos 8 caracteres",
      "Uma letra maiúscula (A-Z)",
      "Uma letra minúscula (a-z)",
      "Um número (0-9)",
      "Um símbolo (! @ # $ %)",
    ]);
    expect(requirements.every((r) => !r.met)).toBe(true);
  });

  it("marca como cumprido o que a senha já tem", () => {
    const met = passwordRequirements("Abc1").map((r) => r.met);

    expect(met).toEqual([false, true, true, true, false]);
  });

  it("todos cumpridos equivale a senha válida", () => {
    expect(passwordRequirements("Senha@123").every((r) => r.met)).toBe(true);
    expect(isValidPassword("Senha@123")).toBe(true);
  });
});
