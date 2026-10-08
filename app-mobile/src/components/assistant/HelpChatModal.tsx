import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { SUPPORT_EMAIL } from "@/content/support";
import { useHelpChat } from "@/hooks/useHelpChat";
import type { ScreenId } from "@/lib/assistant/fabActions";
import { colors, radius, spacing, typography } from "@/theme";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

interface HelpChatModalProps {
  visible: boolean;
  screen: ScreenId;
  onClose: () => void;
}

// Ajuda: um mini chat com perguntas e respostas prontas sobre como usar a plataforma.
export function HelpChatModal({ visible, screen, onClose }: HelpChatModalProps) {
  const chat = useHelpChat(screen, visible);
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);

  const restart = (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Recomeçar a conversa"
      onPress={chat.restart}
      style={styles.iconButton}
    >
      <Ionicons name="refresh" size={22} color={colors.text} />
    </PressableScale>
  );

  const footer = chat.isOutOfQuestions ? (
    <View style={styles.finished}>
      <Text style={styles.finishedText}>
        Essas são todas as perguntas que sei responder. Ainda com dúvida? Escreva para {SUPPORT_EMAIL}.
      </Text>
      <Button label="Recomeçar conversa" variant="outline" onPress={chat.restart} />
    </View>
  ) : (
    <View style={styles.chipsBox}>
      <Text style={styles.chipsTitle}>Toque em uma pergunta:</Text>
      <ScrollView style={styles.chipsScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          {chat.chips.map((chip) => (
            <PressableScale
              key={chip.id}
              accessibilityRole="button"
              accessibilityLabel={chip.question}
              disabled={chat.isTyping}
              onPress={() => chat.ask(chip)}
              style={[styles.chip, chat.isTyping && styles.chipDisabled]}
            >
              <Text style={styles.chipText}>{chip.question}</Text>
            </PressableScale>
          ))}
          {chat.hasMore && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Mais perguntas"
              onPress={chat.showAll}
              style={[styles.chip, styles.moreChip]}
            >
              <Ionicons name="add" size={18} color={colors.primaryText} />
              <Text style={[styles.chipText, styles.moreText]}>Mais perguntas</Text>
            </PressableScale>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      tall
      icon="chatbubble-ellipses-outline"
      title="Ajuda"
      subtitle="Tire suas dúvidas sobre a plataforma"
      headerAction={restart}
      footer={footer}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: !reduced })}
        keyboardShouldPersistTaps="handled"
      >
        <View aria-live="polite" style={styles.messages}>
          {chat.messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {chat.isTyping && <TypingIndicator />}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  messages: { gap: spacing.sm + 4, padding: spacing.md },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  chipsBox: { gap: spacing.sm },
  chipsTitle: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  chipsScroll: { maxHeight: 240 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  chipDisabled: { opacity: 0.5 },
  chipText: { ...typography.hint, fontWeight: "700", color: colors.primaryText },
  moreChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primaryTint },
  moreText: { color: colors.primaryText },
  finished: { gap: spacing.sm + 4 },
  finishedText: { ...typography.hint, color: colors.textStrong },
});
