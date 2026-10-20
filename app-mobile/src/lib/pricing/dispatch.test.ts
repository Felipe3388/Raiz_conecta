import { buildLadder, dispatchPlan, LADDER_STEP, REGULAR_ROUNDS, RETURN_FACTOR, START_FACTOR } from "./dispatch";

describe("escada do leilão inverso", () => {
  it("o exemplo do mercado que pagou R$ 50: começa em 40 e sobe até 44, e a volta ao 1º produtor vai a 45", () => {
    const ladder = buildLadder(50);
    expect(ladder.map((step) => step.price)).toEqual([40, 41, 42, 43, 44, 45]);
  });

  it("as cinco primeiras são regulares e a última é a volta ao teto", () => {
    const ladder = buildLadder(50);
    expect(ladder.slice(0, REGULAR_ROUNDS).every((step) => step.kind === "regular")).toBe(true);
    expect(ladder[ladder.length - 1].kind).toBe("return");
  });

  it("o preço só sobe e nunca passa do teto nem do que o mercado pagou", () => {
    for (const market of [3, 3.8, 45, 70, 1234.56]) {
      const prices = buildLadder(market).map((step) => step.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
      expect(prices[0]).toBeCloseTo(market * START_FACTOR, 1);
      expect(Math.max(...prices)).toBeLessThanOrEqual(Math.round(market * RETURN_FACTOR * 100) / 100);
      expect(Math.max(...prices)).toBeLessThan(market);
    }
  });

  it("arredonda em centavos", () => {
    expect(buildLadder(3.8).map((step) => step.price)).toEqual([3.04, 3.12, 3.19, 3.27, 3.34, 3.42]);
  });

  it("cada degrau sobe LADDER_STEP do preço do mercado", () => {
    expect(LADDER_STEP).toBe(0.02);
    expect(START_FACTOR + LADDER_STEP * (REGULAR_ROUNDS - 1)).toBeLessThan(RETURN_FACTOR);
  });

  it("preço do mercado inválido não gera escada", () => {
    expect(buildLadder(0)).toEqual([]);
    expect(buildLadder(-5)).toEqual([]);
    expect(buildLadder(Number.NaN)).toEqual([]);
  });
});

describe("a quem cada degrau vai", () => {
  const producers = ["a@x.com", "b@x.com", "c@x.com"];

  it("um produtor por vez, na ordem, e a volta é para o primeiro", () => {
    const plan = dispatchPlan(50, producers);
    expect(plan.map((step) => step.producer)).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "a@x.com",
      "b@x.com",
      "a@x.com",
    ]);
    expect(plan.map((step) => step.price)).toEqual([40, 41, 42, 43, 44, 45]);
  });

  it("com um produtor só, ele recebe todos os degraus", () => {
    expect(dispatchPlan(50, ["a@x.com"]).map((step) => step.producer)).toEqual(Array(6).fill("a@x.com"));
  });

  it("sem produtores não há envio", () => {
    expect(dispatchPlan(50, [])).toEqual([]);
  });
});
