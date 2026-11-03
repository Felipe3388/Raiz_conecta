import { describe, expect, it } from "vitest";
import { buildMural, toMuralItem, validateOffer, type DemandaRow } from "./mural";

const ME = "maria@teste.com";

function demanda(partial: Partial<DemandaRow> = {}): DemandaRow {
  return {
    id: "d1",
    produto: "Alface",
    quantidade: 100,
    unidade: "Kg",
    precoMedio: 5,
    status: "ABERTA",
    criadoEm: "2026-10-20T10:00:00.000Z",
    ofertas: [],
    ...partial,
  };
}

describe("toMuralItem", () => {
  it("soma o que já foi garantido e calcula o que falta", () => {
    const item = toMuralItem(
      demanda({ ofertas: [{ quantidade: 30, emailProdutor: "a@a.com" }, { quantidade: 20, emailProdutor: "b@b.com" }] }),
      ME,
    );
    expect(item.atendido).toBe(50);
    expect(item.faltante).toBe(50);
    expect(item.percentual).toBe(50);
    expect(item.minhaQuantidade).toBeNull();
  });

  it("reconhece a oferta do produtor sem diferenciar maiúsculas", () => {
    const item = toMuralItem(demanda({ ofertas: [{ quantidade: 40, emailProdutor: "MARIA@teste.com" }] }), ME);
    expect(item.minhaQuantidade).toBe(40);
  });

  it("não expõe e-mails e trata preço ausente como zero", () => {
    const item = toMuralItem(demanda({ precoMedio: null, ofertas: [{ quantidade: 1, emailProdutor: "x@x.com" }] }), ME);
    expect(JSON.stringify(item)).not.toContain("x@x.com");
    expect(item.precoMedio).toBe(0);
  });

  it("nunca passa de 100% nem fica com falta negativa", () => {
    const item = toMuralItem(demanda({ quantidade: 10, ofertas: [{ quantidade: 15, emailProdutor: "a@a.com" }] }), ME);
    expect(item.percentual).toBe(100);
    expect(item.faltante).toBe(0);
  });
});

describe("buildMural", () => {
  const demandas = [
    demanda({ id: "alface", produto: "Alface" }),
    demanda({ id: "maca", produto: "Maçã" }),
    demanda({ id: "tomate", produto: "Tomate" }),
    demanda({ id: "fechada", produto: "Alface", status: "CONCLUIDA" }),
    demanda({ id: "minha", produto: "Alface", quantidade: 50, precoMedio: 4, ofertas: [{ quantidade: 20, emailProdutor: ME }] }),
  ];

  it("o mural só tem pedidos abertos, do catálogo do produtor, sem oferta dele", () => {
    const { mural } = buildMural(demandas, ME, ["alface", "MACA"]);
    expect(mural.map((item) => item.id)).toEqual(["alface", "maca"]);
  });

  it("'minhas' traz o que o produtor já ofertou, mesmo de produto fora do catálogo", () => {
    const { minhas } = buildMural(demandas, ME, []);
    expect(minhas.map((item) => item.id)).toEqual(["minha"]);
  });

  it("resume o que falta responder e a receita estimada", () => {
    const { resumo } = buildMural(demandas, ME, ["Alface"]);
    expect(resumo).toEqual({ paraResponder: 1, ofertasFeitas: 1, quilosGarantidos: 20, receitaEstimada: 80 });
  });

  it("sem catálogo o mural fica vazio", () => {
    expect(buildMural(demandas, ME, []).mural).toEqual([]);
  });
});

describe("validateOffer", () => {
  const open = demanda({ quantidade: 100, ofertas: [{ quantidade: 60, emailProdutor: "outro@x.com" }] });

  it("aceita até o que falta", () => {
    expect(validateOffer(open, 40, ME)).toBeNull();
  });

  it("recusa mais do que falta, dizendo quanto falta", () => {
    expect(validateOffer(open, 41, ME)).toBe("O mercado só precisa de mais 40 Kg deste item.");
  });

  it("recusa quantidade inválida", () => {
    for (const bad of [0, -3, 2.5, "abc", null, undefined, NaN]) {
      expect(validateOffer(open, bad, ME)).toBe("Informe uma quantidade inteira maior que zero.");
    }
  });

  it("recusa pedido fechado e segunda oferta do mesmo produtor", () => {
    expect(validateOffer({ ...open, status: "CONCLUIDA" }, 10, ME)).toBe("Este pedido já foi totalmente atendido.");
    const withMine = { ...open, ofertas: [{ quantidade: 10, emailProdutor: ME }] };
    expect(validateOffer(withMine, 10, ME)).toBe("Você já fez uma oferta para este pedido.");
  });
});
