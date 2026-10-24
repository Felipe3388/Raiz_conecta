import {
  acceptedRange,
  DEFAULT_TOLERANCE,
  expectedKg,
  judgeWeight,
  MAX_WEIGHING_KG,
  MIN_WEIGHING_KG,
  parseKg,
  toleranceFor,
  valueForKg,
} from "./weight";

describe("expectedKg (peso esperado de um pedido)", () => {
  it("1 unidade do pedido é 1 kg", () => {
    expect(expectedKg(1)).toBe(1);
    expect(expectedKg(10)).toBe(10);
    expect(expectedKg(40)).toBe(40);
  });

  it("não deixa sobra de decimais da conta", () => {
    expect(expectedKg(0.1 + 0.2)).toBe(0.3);
  });

  it("quantidade inválida vira zero", () => {
    expect(expectedKg(-5)).toBe(0);
    expect(expectedKg(Number.NaN)).toBe(0);
  });
});

describe("toleranceFor (quanto pode variar o peso)", () => {
  it("o padrão aceita 2% a menos e 2% a mais", () => {
    expect(DEFAULT_TOLERANCE).toEqual({ under: 0.02, over: 0.02 });
    expect(toleranceFor("Tomate")).toEqual(DEFAULT_TOLERANCE);
  });

  it("um produto da tabela usa a faixa dele, mesmo escrito de outro jeito", () => {
    const table = { alface: { under: 0.05, over: 0.05 } };
    expect(toleranceFor("  ALFACE ", table)).toEqual({ under: 0.05, over: 0.05 });
    expect(toleranceFor("Tomate", table)).toEqual(DEFAULT_TOLERANCE);
  });
});

describe("acceptedRange (a faixa de peso aceita)", () => {
  it("10 kg aceita de 9,8 a 10,2", () => {
    expect(acceptedRange(10, DEFAULT_TOLERANCE)).toEqual({ minKg: 9.8, maxKg: 10.2 });
  });

  it("800 kg aceita de 784 a 816", () => {
    expect(acceptedRange(800, DEFAULT_TOLERANCE)).toEqual({ minKg: 784, maxKg: 816 });
  });

  it("sem erro de ponto flutuante", () => {
    expect(acceptedRange(12, DEFAULT_TOLERANCE)).toEqual({ minKg: 11.76, maxKg: 12.24 });
  });

  it("o mínimo nunca fica abaixo de 1 kg: pedido de 1 kg aceita de 1 a 1,02", () => {
    expect(MIN_WEIGHING_KG).toBe(1);
    expect(acceptedRange(1, DEFAULT_TOLERANCE)).toEqual({ minKg: 1, maxKg: 1.02 });
  });

  it("pedido menor que 1 kg não exige mais do que o pedido", () => {
    expect(acceptedRange(0.5, DEFAULT_TOLERANCE).minKg).toBe(0.5);
  });
});

describe("judgeWeight (o peso está certo?)", () => {
  const judge = (actual: number | null, expected = 10) => judgeWeight(expected, actual, DEFAULT_TOLERANCE);

  it("os exemplos de 10 kg: 9,88 / 10 / 10,2 estão na faixa", () => {
    expect(judge(9.88).verdict).toBe("NA_FAIXA");
    expect(judge(10).verdict).toBe("NA_FAIXA");
    expect(judge(10.2).verdict).toBe("NA_FAIXA");
  });

  it("os limites valem: 9,8 e 10,2 ainda passam", () => {
    expect(judge(9.8).verdict).toBe("NA_FAIXA");
    expect(judge(10.2).verdict).toBe("NA_FAIXA");
  });

  it("passou um pouco do limite: acima ou abaixo", () => {
    expect(judge(10.21).verdict).toBe("ACIMA");
    expect(judge(9.79).verdict).toBe("ABAIXO");
    expect(judge(9).verdict).toBe("ABAIXO");
    expect(judge(12).verdict).toBe("ACIMA");
  });

  it("999 kg num pedido de 10 kg é acima, não aceito", () => {
    expect(judge(999).verdict).toBe("ACIMA");
  });

  it("sem peso (nada pesado ainda)", () => {
    expect(judge(null).verdict).toBe("SEM_PESO");
    expect(judge(0).verdict).toBe("SEM_PESO");
  });

  it("diz quanto falta ou sobra, em kg e em %", () => {
    const below = judge(9);
    expect(below.diffKg).toBe(-1);
    expect(below.diffPercent).toBe(-10);
    const above = judge(11.5);
    expect(above.diffKg).toBe(1.5);
    expect(above.diffPercent).toBe(15);
  });

  it("devolve o esperado e o pesado junto", () => {
    expect(judge(9.88)).toMatchObject({ expectedKg: 10, actualKg: 9.88 });
    expect(judge(null)).toMatchObject({ expectedKg: 10, actualKg: 0 });
  });

  it("devolve a faixa junto", () => {
    expect(judge(10).range).toEqual({ minKg: 9.8, maxKg: 10.2 });
  });

  it("sem peso esperado nada se avalia", () => {
    expect(judgeWeight(0, 5, DEFAULT_TOLERANCE).verdict).toBe("SEM_PESO");
  });

  it("não se perde com gramas fracionadas da balança", () => {
    expect(judge(10.0004).verdict).toBe("NA_FAIXA");
    expect(judge(10.0004).diffKg).toBe(0);
  });
});

describe("valueForKg (quanto vale o peso conferido)", () => {
  it("peso vezes o preço do kg: 1 kg de maçã a R$ 8,00 vale R$ 8,00", () => {
    expect(valueForKg(1, 8)).toBe(8);
    expect(valueForKg(10, 4.5)).toBe(45);
  });

  it("arredonda em centavos", () => {
    expect(valueForKg(9.88, 3.33)).toBe(32.9);
  });

  it("sem preço, vale zero", () => {
    expect(valueForKg(10, null)).toBe(0);
  });
});

describe("parseKg (o peso que a pessoa digitou)", () => {
  it.each([
    ["9,88", 9.88],
    ["9.88", 9.88],
    ["10", 10],
    ["12,5 kg", 12.5],
    ["  0,3KG ", 0.3],
    ["1,234", 1.234],
    ["800", 800],
  ])("lê %p como %p", (text, expected) => {
    expect(parseKg(text)).toBe(expected);
  });

  it.each(["", "abc", "0", "0,0", "-5", "1,2,3", "1.250,5", "9,8888", "12 quilos", MAX_WEIGHING_KG + 1 + ""])(
    "recusa %p",
    (text) => {
      expect(parseKg(text)).toBeNull();
    },
  );

  it("aceita até o limite", () => {
    expect(parseKg(String(MAX_WEIGHING_KG))).toBe(MAX_WEIGHING_KG);
  });
});
