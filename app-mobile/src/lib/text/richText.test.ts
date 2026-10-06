import { splitBold } from "./richText";

describe("splitBold", () => {
  it("separa trechos em negrito marcados com **", () => {
    expect(splitBold("Ao usar a **Raiz Conecta**, você concorda.")).toEqual([
      { text: "Ao usar a ", bold: false },
      { text: "Raiz Conecta", bold: true },
      { text: ", você concorda.", bold: false },
    ]);
  });

  it("devolve um único trecho quando não há negrito", () => {
    expect(splitBold("texto simples")).toEqual([{ text: "texto simples", bold: false }]);
  });

  it("aceita texto que começa e termina em negrito", () => {
    expect(splitBold("**a** e **b**")).toEqual([
      { text: "a", bold: true },
      { text: " e ", bold: false },
      { text: "b", bold: true },
    ]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(splitBold("")).toEqual([]);
  });
});
