import {
  answerProposal,
  currentProposal,
  MAX_ROUNDS,
  planRounds,
  pauseSecondsLeft,
  reconsiderLast,
  REFUSAL_PAUSE_MS,
  roundStatus,
  START_FACTOR,
  startNegotiation,
  visibleRounds,
  type NegotiationInput,
} from "./negotiation";

const input = (over: Partial<NegotiationInput> = {}): NegotiationInput => ({
  marketPrice: 4,
  producerPrice: 3.5,
  suggestedPrice: 3.2,
  ...over,
});

describe("planRounds", () => {
  it("começa baixo (uma fração do preço sugerido) e sobe até o preço do produtor", () => {
    const rounds = planRounds(input());
    expect(rounds[0]).toBeCloseTo(3.2 * START_FACTOR, 2);
    expect(rounds[rounds.length - 1]).toBe(3.5);
  });

  it("só sobe: cada proposta é maior que a anterior, sem repetir", () => {
    const rounds = planRounds(input());
    for (let i = 1; i < rounds.length; i++) expect(rounds[i]).toBeGreaterThan(rounds[i - 1]);
    expect(rounds.length).toBeLessThanOrEqual(MAX_ROUNDS);
  });

  it("nunca passa do preço do mercado, mesmo que o produtor peça mais", () => {
    const rounds = planRounds(input({ producerPrice: 6 }));
    expect(Math.max(...rounds)).toBe(4);
  });

  it("sem preço do produtor, sobe até o preço do mercado", () => {
    const rounds = planRounds(input({ producerPrice: null }));
    expect(rounds[rounds.length - 1]).toBe(4);
  });

  it("sem preço sugerido, parte de uma fração do teto", () => {
    const rounds = planRounds(input({ suggestedPrice: null, producerPrice: null }));
    expect(rounds[0]).toBeCloseTo(4 * START_FACTOR, 2);
  });

  it("se o preço sugerido já estiver acima do teto, há uma proposta só, no teto", () => {
    expect(planRounds(input({ suggestedPrice: 9, producerPrice: 3.5 }))).toEqual([3.5]);
  });

  it("todas as propostas têm no máximo duas casas decimais", () => {
    for (const round of planRounds(input({ suggestedPrice: 3.337, producerPrice: 3.771 }))) {
      expect(Math.round(round * 100)).toBeCloseTo(round * 100, 6);
    }
  });
});

describe("negociação", () => {
  it("abre com a primeira proposta, ainda sem acordo", () => {
    const state = startNegotiation(input());
    expect(state.outcome).toBe("open");
    expect(currentProposal(state)).toBe(state.rounds[0]);
  });

  it("aceitar fecha o acordo naquele preço", () => {
    const state = answerProposal(startNegotiation(input()), "accepted");
    expect(state).toMatchObject({ outcome: "deal", dealPrice: state.rounds[0], autoAccepted: false });
    expect(currentProposal(state)).toBeNull();
  });

  it("recusar passa para uma proposta maior", () => {
    const first = startNegotiation(input());
    const second = answerProposal(first, "rejected");
    expect(second.outcome).toBe("open");
    expect(currentProposal(second)!).toBeGreaterThan(currentProposal(first)!);
    expect(second.answers).toEqual(["rejected"]);
  });

  it("quando a proposta chega ao preço que o produtor pediu, o acordo fecha sozinho nesse preço", () => {
    let state = startNegotiation(input());
    while (state.outcome === "open") state = answerProposal(state, "rejected");
    expect(state).toMatchObject({ outcome: "deal", dealPrice: 3.5, autoAccepted: true });
    // Só as respostas dadas de verdade contam; o aceite automático não é resposta do produtor.
    expect(state.answers.every((a) => a === "rejected")).toBe(true);
  });

  it("se o produtor pede mais que o mercado paga e recusa tudo, termina sem acordo", () => {
    let state = startNegotiation(input({ producerPrice: 6 }));
    while (state.outcome === "open") state = answerProposal(state, "rejected");
    expect(state).toMatchObject({ outcome: "noDeal", dealPrice: null });
  });

  it("depois de fechada, novas respostas não mudam nada", () => {
    const closed = answerProposal(startNegotiation(input()), "accepted");
    expect(answerProposal(closed, "rejected")).toEqual(closed);
  });

  it("com uma proposta só, no preço do produtor, já nasce fechada", () => {
    const state = startNegotiation(input({ suggestedPrice: 9 }));
    expect(state).toMatchObject({ outcome: "deal", dealPrice: 3.5, autoAccepted: true });
  });
});

describe("roundStatus (trilha das propostas)", () => {
  it("marca recusadas, a da vez e as que ainda virão", () => {
    let state = startNegotiation(input({ producerPrice: 6 }));
    state = answerProposal(state, "rejected");
    expect([0, 1, 2].map((index) => roundStatus(state, index))).toEqual(["rejected", "current", "pending"]);
  });

  it("a proposta aceita aparece como aceita e as seguintes ficam sem uso", () => {
    let state = startNegotiation(input({ producerPrice: 6 }));
    state = answerProposal(state, "rejected");
    state = answerProposal(state, "accepted");
    expect([0, 1, 2].map((index) => roundStatus(state, index))).toEqual(["rejected", "accepted", "unused"]);
  });

  it("no fechamento automático, a última proposta aparece como aceita", () => {
    let state = startNegotiation(input());
    while (state.outcome === "open") state = answerProposal(state, "rejected");
    const last = state.rounds.length - 1;
    expect(roundStatus(state, last)).toBe("accepted");
  });

  it("sem acordo, nenhuma proposta fica 'da vez'", () => {
    let state = startNegotiation(input({ producerPrice: 6 }));
    while (state.outcome === "open") state = answerProposal(state, "rejected");
    expect(state.rounds.map((_, index) => roundStatus(state, index)).every((status) => status === "rejected")).toBe(
      true,
    );
  });
});

describe("visibleRounds (o produtor só vê as propostas que já chegaram)", () => {
  const open = () => startNegotiation(input({ suggestedPrice: 3, producerPrice: 4, marketPrice: 4 }));

  it("no começo, só a primeira proposta", () => {
    const state = open();
    expect(visibleRounds(state, true)).toEqual([state.rounds[0]]);
  });

  it("depois de recusar, a próxima só aparece quando a pausa acaba", () => {
    const state = answerProposal(open(), "rejected");
    expect(visibleRounds(state, false)).toEqual(state.rounds.slice(0, 1));
    expect(visibleRounds(state, true)).toEqual(state.rounds.slice(0, 2));
  });

  it("as propostas futuras nunca aparecem", () => {
    const state = open();
    expect(visibleRounds(state, true).length).toBeLessThan(state.rounds.length);
  });

  it("depois do acordo, vai só até a proposta aceita", () => {
    let state = open();
    state = answerProposal(state, "rejected");
    state = answerProposal(state, "accepted");
    expect(visibleRounds(state, true)).toEqual(state.rounds.slice(0, 2));
  });

  it("sem acordo, mostra todas, pois todas foram recusadas", () => {
    let state = startNegotiation(input({ suggestedPrice: 3, producerPrice: null, marketPrice: 4 }));
    while (state.outcome === "open") state = answerProposal(state, "rejected");
    expect(state.outcome).toBe("noDeal");
    expect(visibleRounds(state, true)).toEqual(state.rounds);
  });
});

describe("reconsiderLast (recusei agora, mas aceito)", () => {
  it("desfaz a última recusa e fecha o acordo naquele preço", () => {
    const refused = answerProposal(startNegotiation(input({ suggestedPrice: 3, producerPrice: 4 })), "rejected");
    const first = refused.rounds[0];

    const state = reconsiderLast(refused);

    expect(state.outcome).toBe("deal");
    expect(state.dealPrice).toBe(first);
    expect(state.answers).toEqual(["accepted"]);
    expect(state.autoAccepted).toBe(false);
  });

  it("volta só a última: as recusas de antes continuam", () => {
    let state = startNegotiation(input({ suggestedPrice: 3, producerPrice: 4 }));
    state = answerProposal(state, "rejected");
    state = answerProposal(state, "rejected");

    const back = reconsiderLast(state);

    expect(back.dealPrice).toBe(state.rounds[1]);
    expect(back.answers).toEqual(["rejected", "accepted"]);
  });

  it("sem recusa para desfazer, nada muda", () => {
    const state = startNegotiation(input());
    expect(reconsiderLast(state)).toBe(state);
    const deal = answerProposal(state, "accepted");
    expect(reconsiderLast(deal)).toBe(deal);
  });
});

describe("pauseSecondsLeft", () => {
  it("conta os segundos que faltam, arredondando para cima", () => {
    expect(pauseSecondsLeft(10_000, 5_000)).toBe(5);
    expect(pauseSecondsLeft(10_000, 5_001)).toBe(5);
    expect(pauseSecondsLeft(10_000, 9_500)).toBe(1);
  });

  it("zero quando acabou", () => {
    expect(pauseSecondsLeft(10_000, 10_000)).toBe(0);
    expect(pauseSecondsLeft(10_000, 12_000)).toBe(0);
  });

  it("a pausa dura alguns segundos", () => {
    expect(REFUSAL_PAUSE_MS).toBeGreaterThanOrEqual(3000);
    expect(REFUSAL_PAUSE_MS).toBeLessThanOrEqual(10000);
  });
});
