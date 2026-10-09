import { priceFit } from "./fit";

describe("priceFit", () => {
  it("sem preço do produtor, não há o que comparar", () => {
    expect(priceFit(null, 3.2)).toEqual({ fit: "none", difference: 0 });
  });

  it("sem preço do mercado, também não", () => {
    expect(priceFit(3, null)).toEqual({ fit: "none", difference: 0 });
  });

  it("preço igual ou menor que o do mercado cabe no pedido", () => {
    expect(priceFit(3.2, 3.2)).toEqual({ fit: "within", difference: 0 });
    expect(priceFit(3, 3.2)).toMatchObject({ fit: "within" });
  });

  it("preço maior que o do mercado fica acima, e diz por quanto", () => {
    expect(priceFit(3.7, 3.2)).toEqual({ fit: "above", difference: 0.5 });
  });
});
