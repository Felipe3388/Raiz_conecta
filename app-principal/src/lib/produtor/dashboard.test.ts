import { describe, expect, it } from "vitest";
import { barWidths, respondFirst, revenueByProduct } from "./dashboard";
import type { MuralItem } from "./mural";

function item(over: Partial<MuralItem>): MuralItem {
  return {
    id: "x",
    produto: "Alface",
    quantidade: 100,
    unidade: "Kg",
    precoMedio: 5,
    status: "ABERTA",
    atendido: 0,
    faltante: 100,
    percentual: 0,
    criadoEm: "2026-10-20T10:00:00.000Z",
    minhaQuantidade: null,
    ...over,
  };
}

describe("revenueByProduct", () => {
  it("soma por produto e ordena da maior receita para a menor", () => {
    const rows = revenueByProduct([
      item({ produto: "Alface", minhaQuantidade: 10, precoMedio: 5 }),
      item({ produto: "Tomate", minhaQuantidade: 20, precoMedio: 4 }),
      item({ produto: "Alface", minhaQuantidade: 30, precoMedio: 5 }),
    ]);
    expect(rows).toEqual([
      { produto: "Alface", receita: 200 },
      { produto: "Tomate", receita: 80 },
    ]);
  });

  it("ignora quem não ofertou e respeita o limite", () => {
    const many = Array.from({ length: 8 }, (_, i) => item({ produto: `P${i}`, minhaQuantidade: i + 1 }));
    expect(revenueByProduct([item({ minhaQuantidade: null }), ...many])).toHaveLength(5);
    expect(revenueByProduct([item({ minhaQuantidade: null })])).toEqual([]);
  });
});

describe("respondFirst", () => {
  it("põe primeiro o pedido que espera há mais tempo", () => {
    const list = [
      item({ id: "novo", criadoEm: "2026-10-25T10:00:00.000Z" }),
      item({ id: "velho", criadoEm: "2026-10-10T10:00:00.000Z" }),
      item({ id: "meio", criadoEm: "2026-10-18T10:00:00.000Z" }),
      item({ id: "outro", criadoEm: "2026-10-26T10:00:00.000Z" }),
    ];
    expect(respondFirst(list, 3).map((i) => i.id)).toEqual(["velho", "meio", "novo"]);
    expect(list[0].id).toBe("novo");
  });
});

describe("barWidths", () => {
  it("a maior barra ocupa 100% e as outras ficam proporcionais", () => {
    expect(barWidths([{ produto: "A", receita: 200 }, { produto: "B", receita: 100 }])).toEqual([100, 50]);
  });
  it("uma barra pequena continua visível; lista vazia não quebra", () => {
    expect(barWidths([{ produto: "A", receita: 1000 }, { produto: "B", receita: 1 }])).toEqual([100, 4]);
    expect(barWidths([])).toEqual([]);
  });
});
