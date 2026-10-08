import type { ScreenId } from "@/lib/assistant/fabActions";
import type { ChatMessage, HelpSuggestion } from "@/types/assistant";

// O que o chat de Ajuda precisa. Hoje responde com textos fixos (FixedAssistantService);
// o contrato é assíncrono para um chatbot de verdade entrar depois sem mudar nenhuma tela.
export interface AssistantGateway {
  greeting(screen: ScreenId): Promise<ChatMessage[]>;
  suggestions(screen: ScreenId, askedIds: string[], limit?: number): Promise<HelpSuggestion[]>;
  reply(topicId: string): Promise<ChatMessage>;
}
