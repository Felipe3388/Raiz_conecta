import type { ScreenId } from "@/lib/assistant/fabActions";
import { HELP_TOPICS, suggestionsFor, topicById } from "./helpTopics";

const SCREENS: ScreenId[] = ["mural", "catalogo", "ofertas", "painel", "perfil", "configuracoes"];

describe("HELP_TOPICS", () => {
  it("cada pergunta tem identificador único, pergunta e resposta", () => {
    expect(new Set(HELP_TOPICS.map((t) => t.id)).size).toBe(HELP_TOPICS.length);
    expect(HELP_TOPICS.every((t) => t.question.endsWith("?") && t.answer.length > 20)).toBe(true);
  });

  it("respostas curtas, para ler no celular", () => {
    expect(HELP_TOPICS.every((t) => t.answer.length <= 420)).toBe(true);
  });

  it("ensina o essencial: catálogo, mural, oferta, ofertas e suporte", () => {
    const text = HELP_TOPICS.map((t) => t.answer).join(" ").toLowerCase();
    for (const term of ["catálogo", "mural", "ofertar", "salvar escolhas", "suporte@raizconecta.com.br"]) {
      expect(text).toContain(term);
    }
  });

  it.each(SCREENS)("%s tem perguntas pensadas para ela", (screen) => {
    expect(HELP_TOPICS.filter((t) => t.screens.includes(screen)).length).toBeGreaterThanOrEqual(2);
  });
});

describe("topicById", () => {
  it("acha pelo identificador e devolve undefined para desconhecido", () => {
    expect(topicById(HELP_TOPICS[0].id)).toBe(HELP_TOPICS[0]);
    expect(topicById("nao-existe")).toBeUndefined();
  });
});

describe("suggestionsFor", () => {
  it("mostra primeiro as perguntas da tela atual", () => {
    const first = suggestionsFor("catalogo", [], 4);
    expect(first.length).toBe(4);
    expect(first.every((t) => t.screens.includes("catalogo"))).toBe(true);
  });

  it("não repete o que já foi perguntado", () => {
    const first = suggestionsFor("mural", [], 3);
    const next = suggestionsFor("mural", first.map((t) => t.id), 3);
    expect(next.some((t) => first.some((f) => f.id === t.id))).toBe(false);
  });

  it("quando acabam as da tela, completa com as outras", () => {
    const all = suggestionsFor("perfil", [], 100);
    expect(all.length).toBe(HELP_TOPICS.length);
    const relevantCount = HELP_TOPICS.filter((t) => t.screens.includes("perfil")).length;
    expect(all.slice(0, relevantCount).every((t) => t.screens.includes("perfil"))).toBe(true);
  });

  it("sem limite explícito devolve todas as que sobraram", () => {
    expect(suggestionsFor("mural", HELP_TOPICS.map((t) => t.id))).toEqual([]);
  });
});
