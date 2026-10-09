import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

interface SectionCardProps {
  title: string;
  // Frase curta sob o título (usada na tela Meu Perfil).
  description?: string;
  icon: IconName;
  iconColor?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, icon, iconColor = colors.primary, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1, gap: 2 },
  title: { ...typography.button, fontSize: 16, color: colors.text },
  description: { ...typography.hint, color: colors.textMuted },
  body: { gap: spacing.md },
});
