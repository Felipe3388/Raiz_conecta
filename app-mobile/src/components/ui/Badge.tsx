import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

const VARIANTS: Record<BadgeVariant, { background: string; text: string; dot: string }> = {
  success: { background: colors.primaryTint, text: colors.primaryText, dot: colors.primary },
  warning: { background: colors.warningSoft, text: colors.warningDark, dot: colors.warning },
  danger: { background: colors.dangerSoft, text: colors.dangerText, dot: colors.danger },
  neutral: { background: colors.border, text: colors.textStrong, dot: colors.textSubtle },
  info: { background: colors.infoSoft, text: colors.infoDark, dot: colors.info },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

// Etiqueta de status (Aberta, Fechada...), como o Badge do site.
export function Badge({ label, variant = "neutral", dot = false }: BadgeProps) {
  const style = VARIANTS[variant];
  return (
    <View style={[styles.container, { backgroundColor: style.background }]}>
      {dot && <View style={[styles.dot, { backgroundColor: style.dot }]} />}
      <Text style={[styles.label, { color: style.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  dot: { width: 7, height: 7, borderRadius: radius.full },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
});
