import { includesText, normalizeText } from "./normalize";

describe("normalizeText", () => {
  it("ignora maiúsculas, acentos e espaços nas pontas", () => {
    expect(normalizeText("  Maçã Verde ")).toBe("maca verde");
    expect(normalizeText("ABÓBORA")).toBe("abobora");
  });

  it("devolve texto vazio para texto vazio", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("includesText", () => {
  it("acha parte do texto sem se importar com acento ou caixa", () => {
    expect(includesText("Maçã Gala", "maca")).toBe(true);
    expect(includesText("Tomate", "TOM")).toBe(true);
  });

  it("busca vazia acha tudo", () => {
    expect(includesText("Tomate", "")).toBe(true);
    expect(includesText("Tomate", "   ")).toBe(true);
  });

  it("não acha o que não existe", () => {
    expect(includesText("Tomate", "alface")).toBe(false);
  });
});
