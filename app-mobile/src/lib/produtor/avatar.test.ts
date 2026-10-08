import { AVATAR_EMOJIS, initialsOf } from "./avatar";

describe("initialsOf", () => {
  it.each([
    ["Sítio Boa Esperança", "SB"],
    ["maria", "M"],
    ["  joão  da silva ", "JD"],
    ["Fazenda", "F"],
    ["ana-maria souza", "AS"],
  ])("%p vira %p", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it("sem nome, usa uma letra neutra", () => {
    expect(initialsOf("")).toBe("P");
    expect(initialsOf("   ")).toBe("P");
  });
});

describe("AVATAR_EMOJIS", () => {
  it("oferece opções sem repetir", () => {
    expect(AVATAR_EMOJIS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(AVATAR_EMOJIS.map((o) => o.emoji)).size).toBe(AVATAR_EMOJIS.length);
  });

  it("cada opção tem nome para leitor de tela", () => {
    expect(AVATAR_EMOJIS.every((o) => o.label.length > 0)).toBe(true);
  });
});
