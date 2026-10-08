import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";

interface FabActionPillProps {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  // "muted" é para o que não é uma tarefa (ex.: esconder o botão).
  tone?: "primary" | "muted";
}

// Uma opção do botão aberto: o nome numa etiqueta e o ícone num círculo, tudo tocável.
export function FabActionPill({ label, icon, onPress, tone = "primary" }: FabActionPillProps) {
  const muted = tone === "muted";
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <View style={styles.label}>
        <Text style={[styles.labelText, muted && styles.labelMuted]}>{label}</Text>
      </View>
      <View style={[styles.circle, muted && styles.circleMuted]}>
        <Ionicons name={icon} size={24} color={muted ? colors.textMuted : colors.primaryContrast} />
      </View>
    </PressableScale>
  );
}

const CIRCLE = 52;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4, alignSelf: "flex-end" },
  label: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.18)",
  },
  labelText: { ...typography.button, color: colors.text },
  labelMuted: { color: colors.textMuted },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
  },
  circleMuted: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong },
});
