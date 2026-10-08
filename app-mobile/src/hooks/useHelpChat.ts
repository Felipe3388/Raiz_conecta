import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenId } from "@/lib/assistant/fabActions";
import { getAssistantService, type AssistantGateway } from "@/services";
import { wait } from "@/services/mockLatency";
import type { ChatMessage, HelpSuggestion } from "@/types/assistant";

const FIRST_CHIPS = 4;
// Pausa curta antes da resposta, como quem está digitando.
const TYPING_MS = 700;

// Controller do chat de Ajuda: conversa de perguntas e respostas fixas, na tela em que a pessoa está.
export function useHelpChat(screen: ScreenId, active: boolean, gateway: AssistantGateway = getAssistantService()) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<HelpSuggestion[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const userCounter = useRef(0);

  const restart = useCallback(async () => {
    setShowAll(false);
    setIsTyping(false);
    const [greeting, options] = await Promise.all([gateway.greeting(screen), gateway.suggestions(screen, [])]);
    setMessages(greeting);
    setPending(options);
  }, [gateway, screen]);

  // A conversa recomeça toda vez que a janela abre, já falando da tela atual.
  useEffect(() => {
    if (active) void restart();
  }, [active, restart]);

  async function ask(topic: HelpSuggestion) {
    if (isTyping) return;
    userCounter.current += 1;
    setMessages((current) => [...current, { id: `user-${userCounter.current}`, from: "user", text: topic.question }]);
    setPending((current) => current.filter((item) => item.id !== topic.id));
    setIsTyping(true);
    try {
      const [reply] = await Promise.all([gateway.reply(topic.id), wait(TYPING_MS)]);
      setMessages((current) => [...current, reply]);
    } finally {
      setIsTyping(false);
    }
  }

  return {
    messages,
    isTyping,
    chips: showAll ? pending : pending.slice(0, FIRST_CHIPS),
    hasMore: !showAll && pending.length > FIRST_CHIPS,
    isOutOfQuestions: pending.length === 0,
    showAll: () => setShowAll(true),
    ask,
    restart,
  };
}
