import { suggestionsFor, topicById } from "@/content/helpTopics";
import type { ScreenId } from "@/lib/assistant/fabActions";
import type { ChatMessage, HelpSuggestion } from "@/types/assistant";
import type { AssistantGateway } from "./AssistantGateway";

const INTRO = "Oi! Eu sou o assistente do Raiz Conecta. Respondo as dúvidas mais comuns sobre como usar a plataforma.";
const NOT_UNDERSTOOD = "Não entendi essa pergunta. Escolha uma das opções abaixo, que eu respondo.";

// Onde a pessoa está, dito em uma frase.
const WHERE_YOU_ARE: Record<ScreenId, string> = {
  mural: "Você está no Mural, onde ficam os pedidos dos mercados.",
  catalogo: "Você está no Catálogo, onde marca o que produz.",
  ofertas: "Você está em Ofertas, com os negócios que já garantiu.",
  painel: "Você está no Painel, com o resumo da sua atividade.",
  perfil: "Você está em Meu Perfil, com os dados da sua conta.",
  configuracoes: "Você está em Configurações.",
};

export class FixedAssistantService implements AssistantGateway {
  private counter = 0;

  private message(text: string): ChatMessage {
    this.counter += 1;
    return { id: `bot-${this.counter}`, from: "bot", text };
  }

  async greeting(screen: ScreenId): Promise<ChatMessage[]> {
    return [this.message(INTRO), this.message(`${WHERE_YOU_ARE[screen]} Escolha uma pergunta abaixo.`)];
  }

  async suggestions(screen: ScreenId, askedIds: string[], limit?: number): Promise<HelpSuggestion[]> {
    return suggestionsFor(screen, askedIds, limit).map(({ id, question }) => ({ id, question }));
  }

  async reply(topicId: string): Promise<ChatMessage> {
    return this.message(topicById(topicId)?.answer ?? NOT_UNDERSTOOD);
  }
}
