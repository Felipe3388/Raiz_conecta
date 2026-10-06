import { describe, expect, it } from "vitest";
import { planCatalogSync } from "./planCatalogSync";

const NOW = new Date("2026-10-02T12:00:00Z");

describe("planCatalogSync", () => {
  it("cria vínculos novos, gravando a data só quando há preço", () => {
    const plan = planCatalogSync([], [{ cdProduto: 1, preco: 8 }, { cdProduto: 2 }], NOW);

    expect(plan.create).toEqual([
      { cdProduto: 1, preco: 8, dtAtzPreco: NOW },
      { cdProduto: 2 },
    ]);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.update).toEqual([]);
  });

  it("remove vínculos que saíram da lista", () => {
    const existing = [
      { idRegistro: 10, cdProduto: 1, preco: 5 },
      { idRegistro: 11, cdProduto: 2, preco: null },
    ];

    const plan = planCatalogSync(existing, [{ cdProduto: 1 }], NOW);

    expect(plan.deleteIds).toEqual([11]);
  });

  it("preserva o preço de quem já estava no catálogo e veio sem preço", () => {
    const existing = [{ idRegistro: 10, cdProduto: 1, preco: 5 }];

    const plan = planCatalogSync(existing, [{ cdProduto: 1 }], NOW);

    expect(plan).toEqual({ deleteIds: [], create: [], update: [] });
  });

  it("atualiza o preço quando ele mudou", () => {
    const existing = [{ idRegistro: 10, cdProduto: 1, preco: 5 }];

    const plan = planCatalogSync(existing, [{ cdProduto: 1, preco: 7.5 }], NOW);

    expect(plan.update).toEqual([{ idRegistro: 10, preco: 7.5, dtAtzPreco: NOW }]);
  });

  it("define o preço de um vínculo que ainda não tinha", () => {
    const existing = [{ idRegistro: 10, cdProduto: 1, preco: null }];

    const plan = planCatalogSync(existing, [{ cdProduto: 1, preco: 3 }], NOW);

    expect(plan.update).toEqual([{ idRegistro: 10, preco: 3, dtAtzPreco: NOW }]);
  });

  it("não atualiza quando o preço é o mesmo", () => {
    const existing = [{ idRegistro: 10, cdProduto: 1, preco: 5 }];

    const plan = planCatalogSync(existing, [{ cdProduto: 1, preco: 5 }], NOW);

    expect(plan.update).toEqual([]);
  });

  it("elimina vínculos duplicados do mesmo produto, mantendo o mais antigo", () => {
    const existing = [
      { idRegistro: 12, cdProduto: 1, preco: null },
      { idRegistro: 10, cdProduto: 1, preco: 5 },
    ];

    const plan = planCatalogSync(existing, [{ cdProduto: 1 }], NOW);

    expect(plan.deleteIds).toEqual([12]);
    expect(plan.create).toEqual([]);
  });

  it("remove vínculos órfãos (sem produto)", () => {
    const existing = [{ idRegistro: 9, cdProduto: null, preco: null }];

    const plan = planCatalogSync(existing, [], NOW);

    expect(plan.deleteIds).toEqual([9]);
  });

  it("lista vazia remove todo o catálogo", () => {
    const existing = [
      { idRegistro: 10, cdProduto: 1, preco: 5 },
      { idRegistro: 11, cdProduto: 2, preco: null },
    ];

    expect(planCatalogSync(existing, [], NOW).deleteIds).toEqual([10, 11]);
  });
});
