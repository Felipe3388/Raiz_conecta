import { describe, expect, it } from "vitest";
import { dentroDoPrazoDeCancelamento, diasUteisDesde, parseCarrinho, podeCancelar, toPedido } from "./pedidos";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("diasUteisDesde", () => {
  it("não conta o dia do pedido nem fins de semana", () => {
    // 2026-10-26 é segunda
    expect(diasUteisDesde(d("2026-10-26"), d("2026-10-26"))).toBe(0);
    expect(diasUteisDesde(d("2026-10-26"), d("2026-10-27"))).toBe(1);
    expect(diasUteisDesde(d("2026-10-30"), d("2026-11-02"))).toBe(1); // sexta -> segunda
    expect(diasUteisDesde(d("2026-10-26"), d("2026-11-09"))).toBe(10);
  });
  it("não fica negativo se a data estiver no futuro", () => {
    expect(diasUteisDesde(d("2026-11-10"), d("2026-11-01"))).toBe(0);
  });
});

describe("dentroDoPrazoDeCancelamento", () => {
  it("vale até 7 dias úteis", () => {
    expect(dentroDoPrazoDeCancelamento(d("2026-10-26"), d("2026-11-04"))).toBe(true); // 7
    expect(dentroDoPrazoDeCancelamento(d("2026-10-26"), d("2026-11-05"))).toBe(false); // 8
  });
});

describe("parseCarrinho", () => {
  it("aceita e junta itens repetidos", () => {
    expect(parseCarrinho([{ id: 1, qtd: 2 }, { id: 2, qtd: "3" }, { id: 1, qtd: 4 }])).toEqual({
      ok: true,
      itens: [{ id: 1, qtd: 6 }, { id: 2, qtd: 3 }],
    });
  });
  it.each([
    [[], "Dados inválidos ou carrinho vazio"],
    ["x", "Dados inválidos ou carrinho vazio"],
    [[{ id: 0, qtd: 1 }], "Há um produto inválido no carrinho."],
    [[{ id: 1, qtd: 0 }], "Use uma quantidade inteira entre 1 e 100.000."],
    [[{ id: 1, qtd: 2.5 }], "Use uma quantidade inteira entre 1 e 100.000."],
    [[{ id: 1, qtd: 999999 }], "Use uma quantidade inteira entre 1 e 100.000."],
    [Array.from({ length: 51 }, (_, i) => ({ id: i + 1, qtd: 1 })), "Uma cotação aceita até 50 produtos."],
  ])("recusa %j", (carrinho, error) => {
    expect(parseCarrinho(carrinho)).toEqual({ ok: false, error });
  });
});

describe("toPedido", () => {
  const demanda = {
    id: "d1",
    produto: "Alface",
    quantidade: 100,
    unidade: "Kg",
    precoMedio: 4.5,
    status: "ABERTA",
    criadoEm: "2026-10-26T10:00:00Z",
    ofertas: [
      { id: "o1", quantidade: 30, emailProdutor: "Maria@Teste.com", status: "ACEITA", statusEntrega: "PENDENTE", nota: null },
      { id: "o2", quantidade: 20, emailProdutor: "x@y.com", status: "CANCELADA", statusEntrega: "PENDENTE", nota: null },
    ],
  };

  it("mostra o nome do produtor, nunca o e-mail, e ignora ofertas canceladas", () => {
    const pedido = toPedido(demanda, new Map([["maria@teste.com", "Sítio Boa Vista"]]));
    expect(pedido.ofertas).toEqual([{ id: "o1", quantidade: 30, status: "ACEITA", statusEntrega: "PENDENTE", nota: null, produtor: "Sítio Boa Vista" }]);
    expect(pedido.garantido).toBe(30);
    expect(pedido.percentual).toBe(30);
    expect(JSON.stringify(pedido)).not.toContain("@");
  });
  it("usa 'Produtor' quando o nome não é conhecido", () => {
    expect(toPedido(demanda, new Map()).ofertas[0].produtor).toBe("Produtor");
  });
});

describe("podeCancelar", () => {
  const pedido = (extra = {}) => ({ status: "ABERTA", criadoEm: d("2026-10-26"), ofertas: [{ statusEntrega: "PENDENTE" }], ...extra });

  it("aberto, sem entrega e dentro do prazo", () => {
    expect(podeCancelar(pedido(), d("2026-10-28"))).toBe(true);
    expect(podeCancelar(pedido({ ofertas: [] }), d("2026-11-04"))).toBe(true);
  });
  it("não depois do prazo", () => {
    expect(podeCancelar(pedido(), d("2026-11-05"))).toBe(false);
  });
  it("não se já foi cancelado, concluído ou tem entrega", () => {
    expect(podeCancelar(pedido({ status: "CANCELADA" }), d("2026-10-28"))).toBe(false);
    expect(podeCancelar(pedido({ status: "CONCLUIDA" }), d("2026-10-28"))).toBe(false);
    expect(podeCancelar(pedido({ ofertas: [{ statusEntrega: "ENTREGUE" }] }), d("2026-10-28"))).toBe(false);
  });
  it("aceita a data como texto (o que a API devolve)", () => {
    expect(podeCancelar(pedido({ criadoEm: "2026-10-26T12:00:00.000Z" }), d("2026-10-27"))).toBe(true);
  });
});
