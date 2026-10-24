import type { PriceSignal } from "@/lib/pricing/suggestion";
import { MockPricingService } from "./MockPricingService";

const ME = "maria@sitio.com";

const signals: Record<string, PriceSignal[]> = {
  tomate: [
    { kind: "asked", price: 40 },
    { kind: "asked", price: 44 },
    { kind: "asked", price: 48 },
  ],
};

function create(seedMyPrices: Record<string, number> = {}) {
  return new MockPricingService({ signals, seedMyPrices: () => seedMyPrices, latencyMs: 0 });
}

describe("MockPricingService", () => {
  it("começa com os preços de exemplo de quem entra", async () => {
    expect(await create({ tomate: 46 }).getMyPrices(ME)).toEqual({ tomate: 46 });
  });

  it("define e troca o preço ofertado, achando o produto mesmo com acento ou maiúscula", async () => {
    const service = create();
    await service.setMyPrice(ME, "TOMATE", 45);
    await service.setMyPrice(ME, "tomate", 47.5);
    expect(await service.getMyPrices(ME)).toEqual({ tomate: 47.5 });
  });

  it("remover o preço (null) o apaga", async () => {
    const service = create({ tomate: 46 });
    await service.setMyPrice(ME, "Tomate", null);
    expect(await service.getMyPrices(ME)).toEqual({});
  });

  it("não aceita preço inválido", async () => {
    await expect(create().setMyPrice(ME, "Tomate", -1)).rejects.toThrow("Informe um preço válido.");
    await expect(create().setMyPrice(ME, "Tomate", 0)).rejects.toThrow("Informe um preço válido.");
  });

  it("cada produtor tem os seus preços", async () => {
    const service = create();
    await service.setMyPrice(ME, "Tomate", 45);
    expect(await service.getMyPrices("joao@fazenda.com")).toEqual({});
  });

  it("o preço sugerido é a média dos preços pedidos, e o preço de quem define entra na média", async () => {
    const service = create();
    expect((await service.getSuggestedPrices()).tomate).toEqual({ price: 44, samples: 3 });

    await service.setMyPrice(ME, "Tomate", 52);
    expect((await service.getSuggestedPrices()).tomate).toEqual({ price: 46, samples: 4 });

    await service.setMyPrice(ME, "Tomate", null);
    expect((await service.getSuggestedPrices()).tomate).toEqual({ price: 44, samples: 3 });
  });

  it("trocar o preço não conta duas vezes o mesmo produtor", async () => {
    const service = create();
    await service.setMyPrice(ME, "Tomate", 52);
    await service.setMyPrice(ME, "Tomate", 56);
    expect((await service.getSuggestedPrices()).tomate.samples).toBe(4);
  });

  it("as respostas às propostas ajustam o preço sugerido", async () => {
    const service = create();
    const before = (await service.getSuggestedPrices()).tomate.price;

    await service.recordResponse(ME, { produto: "Tomate", price: 50, answer: "rejected" });

    const after = (await service.getSuggestedPrices()).tomate;
    expect(after.price).toBeGreaterThan(before);
    expect(after.samples).toBe(4);
  });
});
