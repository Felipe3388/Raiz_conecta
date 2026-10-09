import {
  DEFAULT_PLACEMENT,
  dragPoint,
  flipSide,
  liftShift,
  menuDirection,
  parsePlacement,
  restPoint,
  snapPlacement,
  type FabLayout,
} from "./fabPlacement";

// Tela de 400 x 800; o botão (60) fica a 16 das bordas, a 50 do topo e a 100 do fundo.
const layout: FabLayout = { width: 400, height: 800, size: 60, edge: 16, peek: 30, top: 50, bottom: 100 };

describe("restPoint (onde o botão fica parado)", () => {
  it("padrão: canto de baixo, na direita, como sempre foi", () => {
    expect(restPoint(DEFAULT_PLACEMENT, layout, false)).toEqual({ x: 400 - 16 - 60, y: 800 - 100 - 60 });
  });

  it("na esquerda, afastado da borda", () => {
    expect(restPoint({ side: "left", y: 1 }, layout, false).x).toBe(16);
  });

  it("a altura vai de cima (0) até embaixo (1)", () => {
    expect(restPoint({ side: "right", y: 0 }, layout, false).y).toBe(50);
    expect(restPoint({ side: "right", y: 0.5 }, layout, false).y).toBe((50 + 640) / 2);
    expect(restPoint({ side: "right", y: 1 }, layout, false).y).toBe(640);
  });

  it("escondido, só uma abinha de 30 aparece na lateral", () => {
    expect(restPoint({ side: "right", y: 1 }, layout, true).x).toBe(400 - 30);
    expect(restPoint({ side: "left", y: 1 }, layout, true).x).toBe(-(60 - 30));
  });

  it("escondido, a altura continua a mesma", () => {
    expect(restPoint({ side: "right", y: 0.3 }, layout, true).y).toBe(
      restPoint({ side: "right", y: 0.3 }, layout, false).y,
    );
  });

  it("altura fora de 0 a 1 é ajustada", () => {
    expect(restPoint({ side: "right", y: -3 }, layout, false).y).toBe(50);
    expect(restPoint({ side: "right", y: 9 }, layout, false).y).toBe(640);
  });

  it("tela baixa demais para a faixa: o botão fica no limite de cima", () => {
    const tiny = { ...layout, height: 200 };
    expect(restPoint({ side: "right", y: 1 }, tiny, false).y).toBe(50);
  });
});

describe("snapPlacement (onde o botão gruda ao soltar)", () => {
  it("solto na metade esquerda, gruda na esquerda; na direita, na direita", () => {
    expect(snapPlacement({ x: 100, y: 300 }, layout).side).toBe("left");
    expect(snapPlacement({ x: 250, y: 300 }, layout).side).toBe("right");
  });

  it("o centro do botão decide, não a ponta", () => {
    // Centro em 170 (<200): esquerda. Centro em 230 (>200): direita.
    expect(snapPlacement({ x: 140, y: 300 }, layout).side).toBe("left");
    expect(snapPlacement({ x: 200, y: 300 }, layout).side).toBe("right");
  });

  it("guarda a altura como proporção da faixa", () => {
    expect(snapPlacement({ x: 0, y: 50 }, layout).y).toBe(0);
    expect(snapPlacement({ x: 0, y: 640 }, layout).y).toBe(1);
    expect(snapPlacement({ x: 0, y: 345 }, layout).y).toBeCloseTo(0.5, 5);
  });

  it("solto fora da faixa, volta para dentro dela", () => {
    expect(snapPlacement({ x: 0, y: -40 }, layout).y).toBe(0);
    expect(snapPlacement({ x: 0, y: 5000 }, layout).y).toBe(1);
  });

  it("ida e volta: o ponto de repouso gruda no mesmo lugar", () => {
    const placement = { side: "left" as const, y: 0.25 };
    expect(snapPlacement(restPoint(placement, layout, false), layout)).toEqual(placement);
    // Escondido também: a abinha na lateral esquerda continua sendo esquerda.
    expect(snapPlacement(restPoint(placement, layout, true), layout)).toEqual(placement);
  });
});

describe("flipSide (mudar de lado sem arrastar)", () => {
  it("troca esquerda e direita e mantém a altura", () => {
    expect(flipSide({ side: "right", y: 0.4 })).toEqual({ side: "left", y: 0.4 });
    expect(flipSide({ side: "left", y: 0.4 })).toEqual({ side: "right", y: 0.4 });
  });
});

describe("liftShift (sair da frente da barra Salvar Escolhas)", () => {
  it("sem barra, não sobe", () => {
    expect(liftShift(640, layout, 0)).toBe(0);
  });

  it("perto do fundo, sobe o que a barra ocupa", () => {
    expect(liftShift(640, layout, 80)).toBe(80);
  });

  it("no alto da tela, a barra não atrapalha", () => {
    expect(liftShift(200, layout, 80)).toBe(0);
  });

  it("um pouco acima do fundo, sobe só o que falta", () => {
    expect(liftShift(600, layout, 80)).toBe(40);
  });
});

describe("menuDirection (para onde as opções abrem)", () => {
  it("embaixo da tela, abre para cima", () => {
    expect(menuDirection(layout, 640, 4, 64)).toBe("up");
  });

  it("no alto da tela, abre para baixo", () => {
    expect(menuDirection(layout, 50, 4, 64)).toBe("down");
  });

  it("no meio, vai para o lado que tem mais espaço", () => {
    expect(menuDirection(layout, 330, 4, 64)).toBe("up");
    expect(menuDirection(layout, 300, 4, 64)).toBe("down");
  });

  it("se cabe para cima, abre para cima mesmo havendo mais espaço embaixo", () => {
    expect(menuDirection(layout, 330, 2, 64)).toBe("up");
  });
});

describe("parsePlacement (o que foi salvo)", () => {
  it("lê um valor bom", () => {
    expect(parsePlacement({ side: "left", y: 0.25 })).toEqual({ side: "left", y: 0.25 });
  });

  it.each([null, undefined, 7, "x", [], {}, { side: "centro", y: 0.5 }, { side: "left", y: "alto" }, { side: "left" }])(
    "valor estragado %p volta ao padrão",
    (value) => {
      expect(parsePlacement(value)).toEqual(DEFAULT_PLACEMENT);
    },
  );

  it("altura fora de 0 a 1 é ajustada", () => {
    expect(parsePlacement({ side: "right", y: 4 })).toEqual({ side: "right", y: 1 });
    expect(parsePlacement({ side: "right", y: -1 })).toEqual({ side: "right", y: 0 });
    expect(parsePlacement({ side: "right", y: Number.NaN })).toEqual(DEFAULT_PLACEMENT);
  });
});

describe("dragPoint (o botão acompanha o dedo)", () => {
  const start = { x: 324, y: 640 };

  it("anda junto com o dedo, somando o que ele já andou antes de o arrastar começar", () => {
    // Dedo andou 8 antes de o arrastar pegar e mais 100 para a esquerda e 200 para cima depois.
    expect(dragPoint(start, { x: -8, y: -4 }, { x: -100, y: -200 }, layout)).toEqual({ x: 216, y: 436 });
  });

  it("não deixa o botão passar do topo nem do fundo", () => {
    expect(dragPoint(start, { x: 0, y: 0 }, { x: 0, y: -900 }, layout).y).toBe(50);
    expect(dragPoint(start, { x: 0, y: 0 }, { x: 0, y: 900 }, layout).y).toBe(640);
  });

  it("deixa o botão sair da tela só até sobrar a abinha, nos dois lados", () => {
    expect(dragPoint(start, { x: 0, y: 0 }, { x: -900, y: 0 }, layout).x).toBe(-(60 - 30));
    expect(dragPoint(start, { x: 0, y: 0 }, { x: 900, y: 0 }, layout).x).toBe(400 - 30);
  });

  it("tela baixa demais para a faixa: o botão fica no limite de cima", () => {
    expect(dragPoint(start, { x: 0, y: 0 }, { x: 0, y: 300 }, { ...layout, height: 200 }).y).toBe(50);
  });
});
