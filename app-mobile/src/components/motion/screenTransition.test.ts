import { createTransitionTracker, directionBetween, SCREEN_DEPTH } from "./screenTransition";

describe("SCREEN_DEPTH", () => {
  it("segue a ordem do fluxo: login, cadastro, passo 2, conta em análise", () => {
    expect(SCREEN_DEPTH.login).toBeLessThan(SCREEN_DEPTH.cadastro);
    expect(SCREEN_DEPTH.cadastro).toBeLessThan(SCREEN_DEPTH["completar-perfil"]);
    expect(SCREEN_DEPTH["completar-perfil"]).toBeLessThan(SCREEN_DEPTH["em-analise"]);
  });
});

describe("directionBetween", () => {
  it.each([
    [0, 1, "forward"],
    [1, 2, "forward"],
    [2, 3, "forward"],
    [1, 0, "back"],
    [2, 1, "back"],
    [3, 0, "back"],
    [1, 1, "none"],
  ])("de %p para %p é %p", (from, to, expected) => {
    expect(directionBetween(from, to)).toBe(expected);
  });

  it("na primeira tela não há de onde vir", () => {
    expect(directionBetween(null, 0)).toBe("none");
  });
});

describe("createTransitionTracker", () => {
  it("lembra a última tela para dizer a direção da próxima", () => {
    const tracker = createTransitionTracker();

    expect(tracker.enter("login")).toBe("none");
    expect(tracker.enter("cadastro")).toBe("forward");
    expect(tracker.enter("completar-perfil")).toBe("forward");
    expect(tracker.enter("cadastro")).toBe("back");
    expect(tracker.enter("login")).toBe("back");
  });

  it("cada rastreador começa do zero", () => {
    const first = createTransitionTracker();
    first.enter("cadastro");

    expect(createTransitionTracker().enter("login")).toBe("none");
  });
});
