import { ADJUST_RATE, averagePrice, suggestPrice, type PriceSignal } from "./suggestion";

const asked = (price: number): PriceSignal => ({ kind: "asked", price });
const accepted = (price: number): PriceSignal => ({ kind: "accepted", price });
const rejected = (price: number): PriceSignal => ({ kind: "rejected", price });

describe("averagePrice", () => {
  it("é a média simples", () => {
    expect(averagePrice([2, 3, 4])).toBe(3);
  });

  it("ignora preços muito fora do normal (erro de digitação)", () => {
    expect(averagePrice([3, 3.2, 2.8, 3.1, 300])).toBeCloseTo(3.03, 2);
  });

  it("sem preços, não há média", () => {
    expect(averagePrice([])).toBeNull();
  });
});

describe("suggestPrice", () => {
  it("sem nenhuma informação, não sugere nada", () => {
    expect(suggestPrice([])).toBeNull();
  });

  it("parte da média do que os produtores pedem", () => {
    expect(suggestPrice([asked(3), asked(3.4), asked(2.6)])).toEqual({ price: 3, samples: 3 });
  });

  it("sem preços pedidos, usa a média do que foi aceito", () => {
    expect(suggestPrice([accepted(2), accepted(4)])).toEqual({ price: 3, samples: 2 });
  });

  it("recusa em preço acima do sugerido: o preço estava baixo e sobe", () => {
    const base = suggestPrice([asked(3)])!.price;
    const after = suggestPrice([asked(3), rejected(3.5)])!.price;
    expect(after).toBeGreaterThan(base);
    expect(after).toBeLessThan(3.5 * 1.05);
  });

  it("recusa em preço abaixo do sugerido não muda nada (era esperado recusar propostas baixas)", () => {
    expect(suggestPrice([asked(3), rejected(2.4)])!.price).toBe(3);
  });

  it("aceite em preço abaixo do sugerido: o preço estava alto e desce, sem passar do aceito", () => {
    const after = suggestPrice([asked(3), accepted(2.5)])!;
    expect(after.price).toBeLessThan(3);
    expect(after.price).toBeGreaterThan(2.5);
    expect(after.price).toBeCloseTo(3 - 0.5 * ADJUST_RATE, 2);
  });

  it("aceite acima do sugerido não muda nada", () => {
    expect(suggestPrice([asked(3), accepted(3.6)])!.price).toBe(3);
  });

  it("as respostas ajustam em ordem: várias recusas altas puxam o preço para cima aos poucos", () => {
    const one = suggestPrice([asked(3), rejected(3.6)])!.price;
    const three = suggestPrice([asked(3), rejected(3.6), rejected(3.6), rejected(3.6)])!.price;
    expect(three).toBeGreaterThan(one);
    expect(three).toBeLessThanOrEqual(3.6 * 1.05);
  });

  it("o resultado tem no máximo duas casas decimais e conta quantas informações usou", () => {
    const result = suggestPrice([asked(3.333), asked(3.667), rejected(4)])!;
    expect(Math.round(result.price * 100)).toBeCloseTo(result.price * 100, 6);
    expect(result.samples).toBe(3);
  });
});
