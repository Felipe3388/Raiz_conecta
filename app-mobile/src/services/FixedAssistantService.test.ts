import { HELP_TOPICS } from "@/content/helpTopics";
import { FixedAssistantService } from "./FixedAssistantService";

describe("FixedAssistantService", () => {
  it("cumprimenta e diz em que tela a pessoa está", async () => {
    const messages = await new FixedAssistantService().greeting("catalogo");

    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.every((m) => m.from === "bot")).toBe(true);
    expect(messages.map((m) => m.text).join(" ")).toContain("Catálogo");
  });

  it("a saudação muda conforme a tela", async () => {
    const service = new FixedAssistantService();
    const painel = (await service.greeting("painel")).map((m) => m.text).join(" ");
    const ofertas = (await service.greeting("ofertas")).map((m) => m.text).join(" ");

    expect(painel).not.toBe(ofertas);
  });

  it("sugere primeiro as perguntas da tela e respeita o limite", async () => {
    const suggestions = await new FixedAssistantService().suggestions("catalogo", [], 3);

    expect(suggestions).toHaveLength(3);
    expect(suggestions.every((s) => s.id.length > 0 && s.question.endsWith("?"))).toBe(true);
  });

  it("não sugere de novo o que já foi perguntado", async () => {
    const service = new FixedAssistantService();
    const [first] = await service.suggestions("ofertas", [], 1);

    const next = await service.suggestions("ofertas", [first.id]);

    expect(next.some((s) => s.id === first.id)).toBe(false);
  });

  it("responde com o texto fixo da pergunta", async () => {
    const topic = HELP_TOPICS[0];

    const reply = await new FixedAssistantService().reply(topic.id);

    expect(reply).toMatchObject({ from: "bot", text: topic.answer });
  });

  it("pergunta desconhecida recebe um aviso gentil, sem quebrar", async () => {
    const reply = await new FixedAssistantService().reply("nao-existe");

    expect(reply.from).toBe("bot");
    expect(reply.text).toMatch(/não entendi/i);
  });

  it("cada mensagem tem identificador próprio", async () => {
    const service = new FixedAssistantService();
    const a = await service.reply(HELP_TOPICS[0].id);
    const b = await service.reply(HELP_TOPICS[0].id);
    const greeting = await service.greeting("ofertas");

    const ids = [a.id, b.id, ...greeting.map((m) => m.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
