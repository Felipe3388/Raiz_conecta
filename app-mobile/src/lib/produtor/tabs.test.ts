import { HOME_ROUTE, splitTabs } from "./tabs";

describe("splitTabs (o botão Início fica no meio da barra)", () => {
  it("quatro abas: duas de cada lado, na ordem declarada", () => {
    expect(splitTabs(["mural", "catalogo", "painel", "ofertas", "entregas"])).toEqual({
      left: ["mural", "catalogo"],
      right: ["ofertas", "entregas"],
      home: "painel",
    });
  });

  it("o Início não precisa estar no meio da lista de rotas", () => {
    expect(splitTabs(["painel", "mural", "catalogo", "ofertas", "entregas"])).toEqual({
      left: ["mural", "catalogo"],
      right: ["ofertas", "entregas"],
      home: "painel",
    });
  });

  it("número ímpar de abas: o lado esquerdo fica com a maior parte", () => {
    expect(splitTabs(["a", "b", "c", "painel"])).toEqual({ left: ["a", "b"], right: ["c"], home: "painel" });
  });

  it("sem a rota inicial, não há botão do meio", () => {
    expect(splitTabs(["mural", "catalogo", "ofertas", "entregas"]).home).toBeNull();
  });

  it("sem nenhuma rota", () => {
    expect(splitTabs([])).toEqual({ left: [], right: [], home: null });
  });

  it("a rota inicial é o Painel", () => {
    expect(HOME_ROUTE).toBe("painel");
  });

  it("aceita outra rota como início", () => {
    expect(splitTabs(["a", "b", "c", "d"], "c")).toEqual({ left: ["a", "b"], right: ["d"], home: "c" });
  });
});
