import { HOLD_DELAY_MS, heldValue, repeatInterval, repeatStep } from "./holdRepeat";

describe("repeatInterval", () => {
  it("começa devagar e só acelera, até um mínimo", () => {
    const intervals = Array.from({ length: 60 }, (_, tick) => repeatInterval(tick));
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeLessThanOrEqual(intervals[i - 1]);
    expect(intervals[0]).toBeGreaterThan(intervals[59]);
    expect(Math.min(...intervals)).toBeGreaterThanOrEqual(30);
  });

  it("espera um instante antes de começar a repetir, para um toque simples não disparar", () => {
    expect(HOLD_DELAY_MS).toBeGreaterThanOrEqual(300);
  });
});

describe("repeatStep", () => {
  it("anda de 1 em 1 no começo", () => {
    expect(repeatStep(0, 500)).toBe(1);
    expect(repeatStep(5, 500)).toBe(1);
  });

  it("aumenta o passo quando a pessoa segura por muito tempo, conforme o tamanho do limite", () => {
    expect(repeatStep(40, 500)).toBeGreaterThan(repeatStep(15, 500));
    expect(repeatStep(15, 500)).toBeGreaterThan(1);
  });

  it("nunca é menor que 1, mesmo com limite pequeno", () => {
    expect(repeatStep(100, 3)).toBe(1);
    expect(repeatStep(100, 0)).toBe(1);
  });
});

describe("heldValue", () => {
  it("soma o passo e continua enquanto há espaço", () => {
    expect(heldValue(10, 1, 0, 100)).toEqual({ value: 11, done: false });
  });

  it("para exatamente no limite, sem passar do que foi pedido", () => {
    expect(heldValue(99, 1, 0, 100)).toEqual({ value: 100, done: true });
    expect(heldValue(98, 1, 40, 100)).toEqual({ value: 100, done: true });
  });

  it("diminuindo, para no zero e nunca fica negativo", () => {
    expect(heldValue(1, -1, 0, 100)).toEqual({ value: 0, done: true });
    expect(heldValue(1, -1, 40, 100)).toEqual({ value: 0, done: true });
    expect(heldValue(3, -1, 40, 100)).toEqual({ value: 1, done: false });
  });

  it("com o limite em zero, nada se move", () => {
    expect(heldValue(0, 1, 0, 0)).toEqual({ value: 0, done: true });
  });

  it("em nenhuma repetição o valor passa do limite", () => {
    let value = 0;
    for (let tick = 0; tick < 500 && value < 137; tick++) {
      value = heldValue(value, 1, tick, 137).value;
      expect(value).toBeLessThanOrEqual(137);
    }
    expect(value).toBe(137);
  });
});
