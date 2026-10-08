export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
}

// Uma pergunta que a pessoa pode tocar para o assistente responder.
export interface HelpSuggestion {
  id: string;
  question: string;
}
