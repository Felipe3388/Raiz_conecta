import {
  acceptedRange,
  DEFAULT_TOLERANCE,
  expectedKg,
  judgeWeight,
  kgPerUnit,
  MAX_WEIGHING_KG,
  parseKg,
  toleranceFor,
  valueForKg,
} from "./weight";

describe("kgPerUnit (quanto pesa uma unidade do pedido)", () => {
  it("Kg pesa 1, Caixas e Maços vêm da tabela", () => {
    expect(kgPerUnit("Kg")).toBe(1);
    expect(kgPerUnit("Caixas")).toBe(20);
    expect(kgPerUnit("Maços")).toBe(0.4);
  });

  it("ignora maiúsculas, acento e singular", () => {
    expect(kgPerUnit("KG")).toBe(1);
    expect(kgPerUnit("caixa")).toBe(20);
    expect(kgPerUnit("MACO")).toBe(0.4);
    expect(kgPerUnit(" maços ")).toBe(0.4);
  });

  it("unidade que não está na tabela conta como kg", () => {
    expect(kgPerUnit("Sacas")).toBe(1);
    expect(kgPerUnit("")).toBe(1);
  });
});

describe("expectedKg (peso esperado de um pedido)", () => {
  it("multiplica a quantidade pelo peso da unidade", () => {
    expect(expectedKg(10, "Kg")).toBe(10);
    expect(expectedKg(40, "Caixas")).toBe(800);
    expect(expectedKg(30, "Maços")).toBe(12);
  });

  it("não deixa sobra de decimais da conta", () => {
    expect(expectedKg(3, "Maços")).toBe(1.2);
    expect(expectedKg(7, "Maços")).toBe(2.8);
  });

  it("quantidade inválida vira zero", () => {
    expect(expectedKg(-5, "Kg")).toBe(0);
    expect(expectedKg(Number.NaN, "Kg")).toBe(0);
  });
});

describe("toleranceFor (quanto pode variar o peso)", () => {
  it("o padrão aceita 2% a menos e 10% a mais", () => {
    expect(DEFAULT_TOLERANCE).toEqual({ under: 0.02, over: 0.1 });
    expect(toleranceFor("Tomate")).toEqual(DEFAULT_TOLERANCE);
  });

  it("um produto da tabela usa a faixa dele, mesmo escrito de outro jeito", () => {
    const table = { alface: { under: 0.05, over: 0.15 } };
    expect(toleranceFor("  ALFACE ", table)).toEqual({ under: 0.05, over: 0.15 });
    expect(toleranceFor("Tomate", table)).toEqual(DEFAULT_TOLERANCE);
  });
});

describe("acceptedRange (a faixa de peso aceita)", () => {
  it("10 kg aceita de 9,8 a 11", () => {
    expect(acceptedRange(10, DEFAULT_TOLERANCE)).toEqual({ minKg: 9.8, maxKg: 11 });
  });

  it("800 kg aceita de 784 a 880", () => {
    expect(acceptedRange(800, DEFAULT_TOLERANCE)).toEqual({ minKg: 784, maxKg: 880 });
  });

  it("sem erro de ponto flutuante", () => {
    expect(acceptedRange(12, DEFAULT_TOLERANCE)).toEqual({ minKg: 11.76, maxKg: 13.2 });
  });
});

describe("judgeWeight (o peso está certo?)", () => {
  const judge = (actual: number | null, expected = 10) => judgeWeight(expected, actual, DEFAULT_TOLERANCE);

  it("os exemplos de 10 kg: 9,88 / 10 / 11 estão na faixa", () => {
    expect(judge(9.88).verdict).toBe("NA_FAIXA");
    expect(judge(10).verdict).toBe("NA_FAIXA");
    expect(judge(11).verdict).toBe("NA_FAIXA");
  });

  it("os limites valem: 9,8 e 11 ainda passam", () => {
    expect(judge(9.8).verdict).toBe("NA_FAIXA");
    expect(judge(11.0).verdict).toBe("NA_FAIXA");
  });

  it("passou um pouco do limite: acima ou abaixo", () => {
    expect(judge(11.01).verdict).toBe("ACIMA");
    expect(judge(9.79).verdict).toBe("ABAIXO");
    expect(judge(9).verdict).toBe("ABAIXO");
    expect(judge(12).verdict).toBe("ACIMA");
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
    expect(judge(10).range).toEqual({ minKg: 9.8, maxKg: 11 });
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
  it("Kg: peso vezes o preço do kg", () => {
    expect(valueForKg(10, "Kg", 4.5)).toBe(45);
  });

  it("Caixas: o peso vira caixas antes de multiplicar pelo preço da caixa", () => {
    expect(valueForKg(800, "Caixas", 47)).toBe(1880);
    expect(valueForKg(10, "Caixas", 47)).toBe(23.5);
  });

  it("arredonda em centavos", () => {
    expect(valueForKg(9.88, "Kg", 3.33)).toBe(32.9);
  });

  it("sem preço, vale zero", () => {
    expect(valueForKg(10, "Kg", null)).toBe(0);
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
