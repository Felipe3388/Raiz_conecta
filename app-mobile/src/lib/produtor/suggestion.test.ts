import { normalizePrice, validateSuggestion } from "./suggestion";

describe("normalizePrice", () => {
  it.each([
    ["8.50", "8.50"],
    ["8,50", "8.50"],
    [" 12 ", "12"],
    ["", ""],
  ])("%p vira %p", (input, expected) => {
    expect(normalizePrice(input)).toBe(expected);
  });
});

describe("validateSuggestion", () => {
  const valid = { nomeProduto: "Pitaya Vermelha", descricao: "", precoSugerido: "", attachment: null };

  it("aceita só o nome do produto", () => {
    expect(validateSuggestion(valid)).toBeNull();
  });

  it("aceita preço com vírgula ou ponto", () => {
    expect(validateSuggestion({ ...valid, precoSugerido: "8,50" })).toBeNull();
    expect(validateSuggestion({ ...valid, precoSugerido: "8.50" })).toBeNull();
  });

  it("exige o nome do produto", () => {
    expect(validateSuggestion({ ...valid, nomeProduto: "   " })).toBe("Dê um nome ao produto.");
  });

  it.each(["abc", "0", "-5"])("recusa o preço %p", (precoSugerido) => {
    expect(validateSuggestion({ ...valid, precoSugerido })).toBe(
      "Informe um preço válido, como 8,50.",
    );
  });
});
