import {
  checklistItems,
  isValidPassword,
  newlyMetLabels,
  passwordRequirements,
  passwordStrength,
  unmetRequirements,
} from "./password";

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

describe("unmetRequirements", () => {
  it("senha vazia ainda não cumpriu nada: todos os cinco aparecem", () => {
    expect(unmetRequirements("")).toHaveLength(5);
  });

  it("lista só o que falta", () => {
    expect(unmetRequirements("Abc1").map((r) => r.label)).toEqual([
      "Pelo menos 8 caracteres",
      "Um símbolo (! @ # $ %)",
    ]);
  });

  it("senha completa não deixa nada faltando", () => {
    expect(unmetRequirements("Senha@123")).toEqual([]);
  });
});

describe("newlyMetLabels", () => {
  it("devolve o que acabou de ser cumprido entre uma digitação e outra", () => {
    expect(newlyMetLabels(passwordRequirements("abc"), passwordRequirements("abcD"))).toEqual([
      "Uma letra maiúscula (A-Z)",
    ]);
  });

  it("não repete o que já estava cumprido nem o que ainda falta", () => {
    expect(newlyMetLabels(passwordRequirements("abc"), passwordRequirements("abcd"))).toEqual([]);
  });

  it("apagar caracteres não conta como cumprido", () => {
    expect(newlyMetLabels(passwordRequirements("abcD"), passwordRequirements("abc"))).toEqual([]);
  });
});

describe("checklistItems", () => {
  it("não mostra nada antes de digitar", () => {
    expect(checklistItems("", []).every((item) => !item.shown)).toBe(true);
  });

  it("mostra só o que falta", () => {
    const shown = checklistItems("abc", []).filter((item) => item.shown).map((item) => item.label);
    expect(shown).toEqual([
      "Pelo menos 8 caracteres",
      "Uma letra maiúscula (A-Z)",
      "Um número (0-9)",
      "Um símbolo (! @ # $ %)",
    ]);
  });

  it("mantém por um instante o que acabou de ser cumprido", () => {
    const items = checklistItems("abcD", ["Uma letra maiúscula (A-Z)"]);
    expect(items.find((item) => item.label === "Uma letra maiúscula (A-Z)")).toMatchObject({ met: true, shown: true });
    expect(items.find((item) => item.label === "Uma letra minúscula (a-z)")).toMatchObject({ met: true, shown: false });
  });

  it("com a senha toda cumprida, nada fica à mostra depois do instante", () => {
    expect(checklistItems("Senha@123", []).some((item) => item.shown)).toBe(false);
  });

  it("apagar a senha esconde tudo, mesmo o que estava em destaque", () => {
    expect(checklistItems("", ["Uma letra maiúscula (A-Z)"]).some((item) => item.shown)).toBe(false);
  });
});
