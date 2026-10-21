import { betweenPrompt, spokenKg, weighPrompt } from "./prompts";

describe("spokenKg", () => {
  it.each([
    [10, "10 quilos"],
    [1, "1 quilo"],
    [9.88, "9,88 quilos"],
    [0.4, "0,4 quilos"],
    [1234.5, "1.234,5 quilos"],
  ])("%p kg", (kg, text) => {
    expect(spokenKg(kg)).toBe(text);
  });
});

describe("weighPrompt", () => {
  it("diz sempre o mercado, o peso e o produto", () => {
    expect(weighPrompt({ mercado: "Empório São José", produto: "Abacaxi", expectedKg: 10 })).toBe(
      "Empório São José. Coloque na balança 10 quilos de abacaxi.",
    );
    expect(weighPrompt({ mercado: "Empório São José", produto: "Alface", expectedKg: 1 })).toBe(
      "Empório São José. Coloque na balança 1 quilo de alface.",
    );
  });
});

describe("betweenPrompt", () => {
  it("avisa o pedido que acabou, o próximo e o tempo", () => {
    expect(betweenPrompt("Empório", "Mercado Teste", 5)).toBe(
      "Pedido de Empório concluído. Próximo pedido: Mercado Teste. Começa em 5 segundos.",
    );
  });
});
