import { badgeLabel, HOME_ROUTE, PRODUCER_TABS, splitTabs, visibleTabs } from "./tabs";

describe("splitTabs (o botão Início fica no meio da barra)", () => {
  it("as quatro abas do Produtor: Catálogo e Ofertas à esquerda; Entregas e Mais à direita", () => {
    expect(splitTabs(["catalogo", "ofertas", "painel", "entregas", "mais"])).toEqual({
      left: ["catalogo", "ofertas"],
      right: ["entregas", "mais"],
      home: "painel",
    });
  });

  it("o Início não precisa estar no meio da lista de rotas", () => {
    expect(splitTabs(["painel", "catalogo", "ofertas", "entregas", "mais"])).toEqual({
      left: ["catalogo", "ofertas"],
      right: ["entregas", "mais"],
      home: "painel",
    });
  });

  it("três abas: a que sobra vai para a direita", () => {
    expect(splitTabs(["catalogo", "painel", "ofertas", "entregas"])).toEqual({
      left: ["catalogo"],
      right: ["ofertas", "entregas"],
      home: "painel",
    });
  });

  it("quatro abas: duas de cada lado", () => {
    expect(splitTabs(["a", "b", "painel", "c", "d"])).toEqual({ left: ["a", "b"], right: ["c", "d"], home: "painel" });
  });

  it("número ímpar de abas: o lado direito fica com a maior parte", () => {
    expect(splitTabs(["a", "b", "c", "painel"])).toEqual({ left: ["a"], right: ["b", "c"], home: "painel" });
  });

  it("sem a rota inicial, não há botão do meio", () => {
    expect(splitTabs(["catalogo", "ofertas", "entregas"]).home).toBeNull();
  });

  it("sem nenhuma rota", () => {
    expect(splitTabs([])).toEqual({ left: [], right: [], home: null });
  });

  it("a rota inicial é o Painel", () => {
    expect(HOME_ROUTE).toBe("painel");
  });

  it("aceita outra rota como início", () => {
    expect(splitTabs(["a", "b", "c", "d"], "c")).toEqual({ left: ["a"], right: ["b", "d"], home: "c" });
  });
});

describe("badgeLabel", () => {
  it("sem número, só o nome da aba", () => {
    expect(badgeLabel("Ofertas", 0, "pedido", "pedidos")).toBe("Ofertas");
  });

  it("um e vários, no singular e no plural", () => {
    expect(badgeLabel("Ofertas", 1, "pedido para responder", "pedidos para responder")).toBe(
      "Ofertas, 1 pedido para responder",
    );
    expect(badgeLabel("Entregas", 2, "pedido", "pedidos")).toBe("Entregas, 2 pedidos");
  });
});

describe("visibleTabs", () => {
  it("só as telas da barra viram botão; uma tela antiga que sobrou (mural) fica de fora", () => {
    expect(visibleTabs(["catalogo", "mural", "ofertas", "painel", "entregas", "mais"])).toEqual([
      "catalogo",
      "ofertas",
      "painel",
      "entregas",
      "mais",
    ]);
  });

  it("a rota inicial faz parte das abas permitidas", () => {
    expect(PRODUCER_TABS).toContain(HOME_ROUTE);
  });
});
