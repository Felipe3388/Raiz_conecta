import { fabActionsFor, hasTabBar, screenFromPath, type ScreenId } from "./fabActions";

const SCREENS: ScreenId[] = [
  "mural",
  "catalogo",
  "ofertas",
  "entregas",
  "painel",
  "perfil",
  "configuracoes",
  "simulador",
];

describe("screenFromPath", () => {
  it.each([
    ["/mural", "mural"],
    ["/catalogo", "catalogo"],
    ["/ofertas", "ofertas"],
    ["/entregas", "entregas"],
    ["/painel", "painel"],
    ["/perfil", "perfil"],
    ["/configuracoes", "configuracoes"],
    ["/simulador-preco", "simulador"],
    ["/catalogo/", "catalogo"],
    ["/", "mural"],
    ["/qualquer-coisa", "mural"],
  ])("%p é a tela %p", (path, screen) => {
    expect(screenFromPath(path)).toBe(screen);
  });
});

describe("hasTabBar", () => {
  it("as quatro abas e o Painel (botão Início) têm barra inferior", () => {
    expect(SCREENS.filter(hasTabBar)).toEqual(["mural", "catalogo", "ofertas", "entregas", "painel"]);
  });
});

describe("fabActionsFor", () => {
  it.each(SCREENS)("%s sempre oferece Ajuda, por último (perto do botão)", (screen) => {
    const ids = fabActionsFor(screen).map((a) => a.id);
    expect(ids[ids.length - 1]).toBe("help");
  });

  it("catálogo: sugerir produto e ver as sugestões enviadas", () => {
    const ids = fabActionsFor("catalogo").map((a) => a.id);
    expect(ids).toEqual(["suggest", "mySuggestions", "help"]);
  });

  it("mural leva ao catálogo; ofertas e painel levam ao mural", () => {
    expect(fabActionsFor("mural").map((a) => a.id)).toContain("goCatalog");
    expect(fabActionsFor("ofertas").map((a) => a.id)).toContain("goMural");
    expect(fabActionsFor("painel").map((a) => a.id)).toContain("goMural");
  });

  it("não oferece ir para a própria tela", () => {
    expect(fabActionsFor("mural").map((a) => a.id)).not.toContain("goMural");
    expect(fabActionsFor("catalogo").map((a) => a.id)).not.toContain("goCatalog");
  });

  it.each(SCREENS)("%s: ações com nome, ícone e sem repetição", (screen) => {
    const actions = fabActionsFor(screen);
    expect(new Set(actions.map((a) => a.id)).size).toBe(actions.length);
    expect(actions.every((a) => a.label.length > 0 && a.icon.length > 0)).toBe(true);
  });

  it("com ações para desfazer, oferece Desfazer logo antes da Ajuda", () => {
    for (const screen of SCREENS) {
      const ids = fabActionsFor(screen, true).map((a) => a.id);
      expect(ids).toContain("undo");
      expect(ids[ids.length - 1]).toBe("help");
      expect(ids[ids.length - 2]).toBe("undo");
    }
  });

  it("sem ações para desfazer, não oferece Desfazer", () => {
    for (const screen of SCREENS) expect(fabActionsFor(screen).map((a) => a.id)).not.toContain("undo");
  });
});
