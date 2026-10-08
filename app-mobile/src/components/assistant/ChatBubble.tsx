import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Reveal } from "@/components/motion/Reveal";
import type { ChatMessage } from "@/types/assistant";
import { colors, radius, spacing, typography } from "@/theme";

// Balão de conversa: o assistente à esquerda, a pessoa à direita.
export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.from === "user";
  return (
    <Reveal offset={8} style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="leaf" size={16} color={colors.primaryText} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message.text}</Text>
      </View>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, maxWidth: "100%" },
  rowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
  },
  bubble: { maxWidth: "82%", paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  bot: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderMid, borderBottomLeftRadius: 4 },
  user: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  text: { ...typography.body, color: colors.text },
  userText: { color: colors.primaryContrast },
});
