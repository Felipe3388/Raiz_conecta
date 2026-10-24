import {
  EMPTY_KG,
  holdTick,
  isEmptyScale,
  keepLocked,
  readingSpread,
  scaleStatus,
  STABLE_HOLD_SECONDS,
  STABLE_SAMPLES,
  stableReading,
} from "./scale";

const steady = (kg: number, times = STABLE_SAMPLES) => Array.from({ length: times }, () => kg);

describe("stableReading (a balança parou de oscilar?)", () => {
  it("amostras iguais são estáveis e dão o valor", () => {
    expect(stableReading(steady(9.88))).toBe(9.88);
  });

  it("poucas amostras ainda não bastam", () => {
    expect(stableReading(steady(9.88, STABLE_SAMPLES - 1))).toBeNull();
    expect(stableReading([])).toBeNull();
  });

  it("oscilação de poucos gramas é estável e devolve o valor do meio", () => {
    expect(stableReading([9.88, 9.89, 9.88, 9.87, 9.88])).toBe(9.88);
    expect(stableReading([9.87, 9.88, 9.88, 9.89, 9.88])).toBe(9.88);
  });

  it("uma leitura fora do normal não muda o valor, se o resto está junto", () => {
    expect(stableReading([6, 6, 6.01, 6, 6])).toBe(6);
  });

  it("oscilação grande não é estável", () => {
    expect(stableReading([9.2, 9.6, 9.88, 9.9, 9.5])).toBeNull();
  });

  it("só olha as últimas amostras: o que veio antes (balança subindo) não atrapalha", () => {
    expect(stableReading([0, 3, 7, ...steady(9.88)])).toBe(9.88);
  });

  it("pesos grandes aceitam oscilação maior, na mesma proporção", () => {
    expect(stableReading([800.4, 800.9, 800.2, 800.6, 800.5])).not.toBeNull();
    expect(stableReading([800.4, 806, 800.2, 800.6, 800.5])).toBeNull();
  });

  it("balança vazia não vale como peso", () => {
    expect(stableReading(steady(0))).toBeNull();
    expect(stableReading(steady(EMPTY_KG / 2))).toBeNull();
  });

  it("peso negativo (balança descalibrada) não vale", () => {
    expect(stableReading(steady(-0.5))).toBeNull();
  });
});

describe("isEmptyScale", () => {
  it("quase zero é vazia", () => {
    expect(isEmptyScale(0)).toBe(true);
    expect(isEmptyScale(EMPTY_KG / 2)).toBe(true);
    expect(isEmptyScale(-1)).toBe(true);
  });

  it("com peso não é vazia", () => {
    expect(isEmptyScale(0.5)).toBe(false);
  });
});

describe("keepLocked (uma pesagem não conta duas vezes)", () => {
  it("depois de registrar, continua travado enquanto o produto está na balança", () => {
    expect(keepLocked(true, 9.88)).toBe(true);
    expect(keepLocked(true, 0.3)).toBe(true);
  });

  it("destrava quando a balança esvazia", () => {
    expect(keepLocked(true, 0)).toBe(false);
    expect(keepLocked(true, EMPTY_KG / 2)).toBe(false);
  });

  it("sem trava, continua sem trava", () => {
    expect(keepLocked(false, 9.88)).toBe(false);
  });
});

describe("scaleStatus (o que dizer sobre a balança)", () => {
  const base = { connection: "connected" as const, kg: 9.88, stableKg: 9.88, locked: false };

  it("conectando e sem conexão", () => {
    expect(scaleStatus({ ...base, connection: "connecting" })).toBe("connecting");
    expect(scaleStatus({ ...base, connection: "lost" })).toBe("lost");
  });

  it("vazia: pede para colocar o produto", () => {
    expect(scaleStatus({ ...base, kg: 0, stableKg: null })).toBe("empty");
  });

  it("oscilando: aguarde", () => {
    expect(scaleStatus({ ...base, kg: 5.2, stableKg: null })).toBe("settling");
  });

  it("parou: pode registrar", () => {
    expect(scaleStatus(base)).toBe("stable");
  });

  it("depois de registrar, pede para tirar o produto", () => {
    expect(scaleStatus({ ...base, locked: true })).toBe("locked");
  });

  it("travada e já vazia volta a pedir o produto", () => {
    expect(scaleStatus({ ...base, kg: 0, stableKg: null, locked: true })).toBe("empty");
  });
});

describe("holdTick (o peso precisa ficar parado por 5 segundos)", () => {
  it("o peso parado precisa ficar 5 segundos", () => {
    expect(STABLE_HOLD_SECONDS).toBe(5);
  });

  it("conta de 5 até 0 enquanto o peso está estável", () => {
    let left = STABLE_HOLD_SECONDS;
    const seen: number[] = [];
    for (let second = 0; second < 6; second += 1) {
      left = holdTick(left, true);
      seen.push(left);
    }
    expect(seen).toEqual([4, 3, 2, 1, 0, 0]);
  });

  it("se o peso volta a oscilar, a contagem recomeça dos 5 segundos", () => {
    expect(holdTick(2, false)).toBe(STABLE_HOLD_SECONDS);
  });
});

describe("readingSpread (quanto o peso está oscilando)", () => {
  it("mostra a variação das últimas leituras e o limite aceito", () => {
    expect(readingSpread([9.5, 9.9, 9.7, 9.8, 9.6])).toEqual({ spreadKg: 0.4, allowedKg: 0.02 });
  });

  it("o limite cresce com o peso (0,2%), pois balanças grandes oscilam mais", () => {
    expect(readingSpread([100, 100, 100, 100, 100]).allowedKg).toBe(0.2);
  });

  it("sem leituras suficientes, não há variação para mostrar", () => {
    expect(readingSpread([9.5, 9.9])).toEqual({ spreadKg: 0, allowedKg: 0.02 });
    expect(readingSpread([])).toEqual({ spreadKg: 0, allowedKg: 0.02 });
  });
});
