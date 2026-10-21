import type { Proposal, ProposalItem } from "@/types/proposal";
import {
  acceptedItems,
  acceptedTotal,
  answeredStatus,
  canAnswer,
  countdownLabel,
  effectiveStatus,
  filterProposals,
  fullQuantities,
  groupByMarket,
  isPartial,
  itemsSummary,
  itemTotal,
  marketKey,
  minutesLabel,
  onlyMyProducts,
  PROPOSAL_WINDOW_MINUTES,
  proposalCounts,
  proposalTotal,
  quantitiesError,
  searchProposals,
  secondsLeft,
  selectedCount,
  selectionTotal,
  sortProposals,
} from "./proposals";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const inMinutes = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000).toISOString();

function item(overrides: Partial<ProposalItem> = {}): ProposalItem {
  return { id: "i1", produto: "Abacaxi", quantidade: 40, unidade: "Kg", preco: 4, aceita: null, ...overrides };
}

function proposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: "p1",
    numero: 1001,
    mercado: "Mercado Teste",
    itens: [item()],
    entrega: "2026-10-16",
    status: "PENDENTE",
    recebidaEm: inMinutes(-1),
    expiraEm: inMinutes(14),
    respondidaEm: null,
    ...overrides,
  };
}

describe("prazo", () => {
  it("o produtor tem 30 minutos para responder (o aviso ainda chega por e-mail)", () => {
    expect(PROPOSAL_WINDOW_MINUTES).toBe(30);
  });
});

describe("tempo para responder", () => {
  it("conta os segundos que faltam, sem passar de zero", () => {
    expect(secondsLeft(proposal({ expiraEm: inMinutes(14) }), NOW)).toBe(840);
    expect(secondsLeft(proposal({ expiraEm: inMinutes(-3) }), NOW)).toBe(0);
  });

  it("arredonda para cima: com 0,2 s ainda resta 1 s", () => {
    const almost = new Date(NOW.getTime() + 200).toISOString();
    expect(secondsLeft(proposal({ expiraEm: almost }), NOW)).toBe(1);
  });

  it("mostra minutos e segundos, e horas só quando passam de uma", () => {
    expect(countdownLabel(0)).toBe("0:00");
    expect(countdownLabel(5)).toBe("0:05");
    expect(countdownLabel(840)).toBe("14:00");
    expect(countdownLabel(3599)).toBe("59:59");
    expect(countdownLabel(3600)).toBe("1h00");
    expect(countdownLabel(3600 + 5 * 60 + 9)).toBe("1h05");
  });
});

describe("minutesLabel (sem segundos)", () => {
  it("arredonda os minutos para cima", () => {
    expect(minutesLabel(840)).toBe("14 min");
    expect(minutesLabel(61)).toBe("2 min");
    expect(minutesLabel(60)).toBe("1 min");
  });

  it("menos de um minuto e mais de uma hora", () => {
    expect(minutesLabel(59)).toBe("menos de 1 min");
    expect(minutesLabel(0)).toBe("menos de 1 min");
    expect(minutesLabel(3905)).toBe("1h05");
  });
});

describe("situação real da proposta", () => {
  it("pendente com prazo vencido vale como expirada", () => {
    expect(effectiveStatus(proposal({ expiraEm: inMinutes(-1) }), NOW)).toBe("EXPIRADA");
    expect(effectiveStatus(proposal({ expiraEm: inMinutes(1) }), NOW)).toBe("PENDENTE");
  });

  it("o que já foi respondido não muda com o tempo", () => {
    expect(effectiveStatus(proposal({ status: "ACEITA", expiraEm: inMinutes(-9) }), NOW)).toBe("ACEITA");
    expect(effectiveStatus(proposal({ status: "RECUSADA", expiraEm: inMinutes(-9) }), NOW)).toBe("RECUSADA");
  });

  it("só dá para responder a pendente dentro do prazo", () => {
    expect(canAnswer(proposal(), NOW)).toBe(true);
    expect(canAnswer(proposal({ expiraEm: inMinutes(-1) }), NOW)).toBe(false);
    expect(canAnswer(proposal({ status: "ACEITA" }), NOW)).toBe(false);
  });

  it("aceitar vira ACEITA e recusar vira RECUSADA", () => {
    expect(answeredStatus("ACEITAR")).toBe("ACEITA");
    expect(answeredStatus("RECUSAR")).toBe("RECUSADA");
  });
});

describe("valores do pedido", () => {
  const order = proposal({
    itens: [
      item({ id: "a", produto: "Abacaxi", quantidade: 40, preco: 4, aceita: 25 }),
      item({ id: "m", produto: "Morango", quantidade: 30, preco: 3.33, aceita: 0 }),
    ],
  });

  it("valor de cada produto e do pedido inteiro, em centavos", () => {
    expect(itemTotal(order.itens[1])).toBe(99.9);
    expect(proposalTotal(order)).toBe(259.9);
  });

  it("o que foi aceito: só os produtos com quantidade, e a receita desse pedido", () => {
    expect(acceptedItems(order).map((i) => i.id)).toEqual(["a"]);
    expect(acceptedTotal(order)).toBe(100);
  });

  it("sem resposta ainda, nada foi aceito", () => {
    expect(acceptedTotal(proposal())).toBe(0);
    expect(acceptedItems(proposal())).toEqual([]);
  });

  it("o valor das quantidades escolhidas", () => {
    expect(selectionTotal(order, { a: 10, m: 3 })).toBe(49.99);
    expect(selectionTotal(order, {})).toBe(0);
  });

  it("quantos produtos têm quantidade e se a escolha é parcial", () => {
    expect(selectedCount(order, { a: 10, m: 0 })).toBe(1);
    expect(isPartial(order, { a: 40, m: 30 })).toBe(false);
    expect(isPartial(order, { a: 40, m: 29 })).toBe(true);
    expect(isPartial(order, { a: 40 })).toBe(true);
  });
});

describe("quantitiesError", () => {
  const order = proposal({
    itens: [
      item({ id: "a", produto: "Abacaxi", quantidade: 40 }),
      item({ id: "m", produto: "Morango", quantidade: 30 }),
    ],
  });

  it("aceita qualquer parte de cada produto, de 0 ao pedido", () => {
    expect(quantitiesError(order, { a: 40, m: 0 })).toBeNull();
    expect(quantitiesError(order, { a: 1 })).toBeNull();
    expect(quantitiesError(order, { a: 40, m: 30 })).toBeNull();
  });

  it("precisa de pelo menos um produto", () => {
    expect(quantitiesError(order, {})).toBe("Escolha a quantidade de pelo menos um produto.");
    expect(quantitiesError(order, { a: 0, m: 0 })).toBe("Escolha a quantidade de pelo menos um produto.");
  });

  it("não passa do que foi pedido, não aceita negativo nem fração", () => {
    expect(quantitiesError(order, { a: 41 })).toBe("A quantidade de Abacaxi deve ir de 0 a 40.");
    expect(quantitiesError(order, { m: -1 })).toBe("A quantidade de Morango deve ir de 0 a 30.");
    expect(quantitiesError(order, { a: 2.5 })).toBe("A quantidade de Abacaxi deve ir de 0 a 40.");
  });

  it("recusa produto que não é do pedido", () => {
    expect(quantitiesError(order, { x: 1 })).toBe("Há um produto que não faz parte deste pedido.");
  });
});

describe("filtros", () => {
  const list = [
    proposal({ id: "pend" }),
    proposal({ id: "late", expiraEm: inMinutes(-2) }),
    proposal({ id: "ok", status: "ACEITA", respondidaEm: inMinutes(-5) }),
    proposal({ id: "no", status: "RECUSADA", respondidaEm: inMinutes(-5) }),
  ];
  const ids = (items: Proposal[]) => items.map((entry) => entry.id);

  it("Todas mostra tudo", () => {
    expect(ids(filterProposals(list, "all", NOW))).toEqual(["pend", "late", "ok", "no"]);
  });

  it("Pendentes: só as que ainda esperam resposta dentro do prazo", () => {
    expect(ids(filterProposals(list, "pending", NOW))).toEqual(["pend"]);
  });

  it("Aceitas: as que o produtor aderiu", () => {
    expect(ids(filterProposals(list, "accepted", NOW))).toEqual(["ok"]);
  });

  it("Encerradas: recusadas e expiradas (inclusive a que venceu sem a lista recarregar)", () => {
    expect(ids(filterProposals(list, "closed", NOW))).toEqual(["late", "no"]);
  });

  it("os números dos filtros batem com as listas", () => {
    expect(proposalCounts(list, NOW)).toEqual({ all: 4, pending: 1, accepted: 1, closed: 2 });
  });
});

describe("busca", () => {
  const list = [
    proposal({
      id: "a",
      numero: 1001,
      mercado: "Mercado Teste",
      itens: [item({ produto: "Abacaxi" }), item({ id: "i2", produto: "Morango" })],
    }),
    proposal({ id: "b", numero: 2002, mercado: "Empório São José", itens: [item({ produto: "Tomate" })] }),
  ];

  it("acha por um dos produtos do pedido, pelo mercado ou pelo número, sem acento nem maiúsculas", () => {
    expect(searchProposals(list, "ABACA").map((p) => p.id)).toEqual(["a"]);
    expect(searchProposals(list, "morango").map((p) => p.id)).toEqual(["a"]);
    expect(searchProposals(list, "emporio").map((p) => p.id)).toEqual(["b"]);
    expect(searchProposals(list, "2002").map((p) => p.id)).toEqual(["b"]);
    expect(searchProposals(list, "").map((p) => p.id)).toEqual(["a", "b"]);
    expect(searchProposals(list, "uva")).toEqual([]);
  });
});

describe("ordem", () => {
  const list = [
    proposal({
      id: "ok-late",
      numero: 5,
      mercado: "Zeta",
      status: "ACEITA",
      entrega: "2026-10-20",
      recebidaEm: inMinutes(-100),
    }),
    proposal({ id: "no", numero: 4, mercado: "Beta", status: "RECUSADA", recebidaEm: inMinutes(-50) }),
    proposal({
      id: "pend-later",
      numero: 3,
      mercado: "Alfa",
      expiraEm: inMinutes(12),
      recebidaEm: inMinutes(-3),
      itens: [item({ preco: 9 })],
    }),
    proposal({
      id: "ok-soon",
      numero: 2,
      mercado: "Beta",
      status: "ACEITA",
      entrega: "2026-10-16",
      recebidaEm: inMinutes(-200),
    }),
    proposal({ id: "pend-soon", numero: 1, mercado: "Alfa", expiraEm: inMinutes(4), recebidaEm: inMinutes(-10) }),
  ];
  const ids = (sort: Parameters<typeof sortProposals>[1]) => sortProposals(list, sort, NOW).map((p) => p.id);

  it("prioridade: pendentes pelo prazo mais curto, depois aceitas pela entrega, depois o resto", () => {
    expect(ids("priority")).toEqual(["pend-soon", "pend-later", "ok-soon", "ok-late", "no"]);
  });

  it("mais recentes primeiro", () => {
    expect(ids("recent")).toEqual(["pend-later", "pend-soon", "no", "ok-late", "ok-soon"]);
  });

  it("maior valor primeiro", () => {
    expect(ids("valueDesc")[0]).toBe("pend-later");
  });

  it("mercado de A a Z, e pelo número do pedido quando o mercado é o mesmo", () => {
    expect(ids("nameAsc")).toEqual(["pend-soon", "pend-later", "ok-soon", "no", "ok-late"]);
  });

  it("não mexe na lista original", () => {
    const before = list.map((p) => p.id);
    sortProposals(list, "recent", NOW);
    expect(list.map((p) => p.id)).toEqual(before);
  });
});

describe("groupByMarket", () => {
  it("junta os pedidos do mesmo mercado, na ordem em que cada mercado aparece", () => {
    const groups = groupByMarket([
      proposal({ id: "1", mercado: "Mercado Teste" }),
      proposal({ id: "2", mercado: "Empório São José" }),
      proposal({ id: "3", mercado: "mercado teste" }),
    ]);

    expect(groups.map((group) => [group.mercado, group.orders.map((order) => order.id)])).toEqual([
      ["Mercado Teste", ["1", "3"]],
      ["Empório São José", ["2"]],
    ]);
  });

  it("sem pedidos, sem mercados", () => {
    expect(groupByMarket([])).toEqual([]);
  });
});

describe("fullQuantities e itemsSummary", () => {
  const order = proposal({
    itens: [
      item({ id: "a", produto: "Morango", quantidade: 30 }),
      item({ id: "b", produto: "Abacaxi", quantidade: 40 }),
    ],
  });

  it('"Aceitar tudo" escolhe tudo o que foi oferecido, produto a produto', () => {
    expect(fullQuantities(order)).toEqual({ a: 30, b: 40 });
    expect(quantitiesError(order, fullQuantities(order))).toBeNull();
  });

  it("resume os produtos em uma frase", () => {
    expect(itemsSummary(order)).toBe("Morango e Abacaxi");
    expect(itemsSummary(proposal())).toBe("Abacaxi");
    expect(
      itemsSummary(
        proposal({
          itens: [item({ produto: "A" }), item({ id: "i2", produto: "B" }), item({ id: "i3", produto: "C" })],
        }),
      ),
    ).toBe("A, B e C");
  });
});

describe("marketKey", () => {
  it("ignora acento e maiúsculas, como a busca", () => {
    expect(marketKey("Empório São José")).toBe(marketKey("EMPORIO SAO JOSE"));
  });
});

describe("onlyMyProducts (o produtor só vê o que vende)", () => {
  const order = proposal({
    itens: [
      item({ id: "a", produto: "Banana" }),
      item({ id: "b", produto: "Tomate" }),
      item({ id: "c", produto: "Laranja" }),
    ],
  });

  it("um mercado que pediu 3 produtos aparece só com o que o produtor vende", () => {
    const [shown] = onlyMyProducts([order], ["Tomate"]);
    expect(shown.itens.map((entry) => entry.produto)).toEqual(["Tomate"]);
    expect(shown.id).toBe(order.id);
  });

  it("não considera acento nem maiúsculas ao comparar os nomes", () => {
    expect(onlyMyProducts([proposal({ itens: [item({ produto: "Maçã" })] })], ["maca"])).toHaveLength(1);
  });

  it("o pedido sem nenhum produto do produtor some", () => {
    expect(onlyMyProducts([order], ["Cenoura"])).toEqual([]);
  });

  it("sem produtos no catálogo, nenhum pedido pendente aparece", () => {
    expect(onlyMyProducts([order], [])).toEqual([]);
  });

  it("se o produtor vende tudo, o pedido segue igual", () => {
    expect(onlyMyProducts([order], ["Banana", "Tomate", "Laranja"])[0]).toBe(order);
  });

  it("atualiza junto com o catálogo: pôr um produto novo traz o item de volta", () => {
    expect(onlyMyProducts([order], ["Tomate"])[0].itens).toHaveLength(1);
    expect(onlyMyProducts([order], ["Tomate", "Laranja"])[0].itens).toHaveLength(2);
  });

  it("o que o produtor já aceitou continua, mesmo que ele tenha tirado o produto do catálogo", () => {
    const accepted = proposal({
      status: "ACEITA",
      itens: [item({ id: "a", produto: "Morango", aceita: 30 }), item({ id: "b", produto: "Laranja", aceita: 0 })],
    });
    const [shown] = onlyMyProducts([accepted], ["Tomate"]);
    expect(shown.itens.map((entry) => entry.produto)).toEqual(["Morango"]);
  });

  it("não altera a lista recebida", () => {
    const copy = structuredClone(order);
    onlyMyProducts([order], ["Tomate"]);
    expect(order).toEqual(copy);
  });
});
