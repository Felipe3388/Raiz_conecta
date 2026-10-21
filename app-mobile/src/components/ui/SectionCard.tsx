import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, elevation, radius, spacing, typography } from "@/theme";
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
  const iconTint = iconColor === colors.danger ? colors.dangerSoft : colors.primaryTint;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconTile, { backgroundColor: iconTint }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
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
    boxShadow: elevation.card,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  iconTile: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  headerText: { flex: 1, gap: 2 },
  title: { ...typography.subheading, color: colors.text },
  description: { ...typography.hint, color: colors.textMuted },
  body: { gap: spacing.md },
});
