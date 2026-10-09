import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

interface SettingsRowProps {
  icon: IconName;
  label: string;
  description?: string;
  // Elemento à direita (ex.: um interruptor). Sem ele e com onPress, aparece a setinha.
  right?: ReactNode;
  onPress?: () => void;
  tone?: "danger";
}

// Uma linha das Configurações: ícone, nome, explicação curta e, à direita, um interruptor ou a setinha.
export function SettingsRow({ icon, label, description, right, onPress, tone }: SettingsRowProps) {
  const danger = tone === "danger";
  const content = (
    <>
      <Ionicons name={icon} size={24} color={danger ? colors.danger : colors.textStrong} />
      <View style={styles.text}>
        <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />)}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={0.985}
      style={styles.row}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4, minHeight: 52 },
  text: { flex: 1, gap: 2 },
  label: { ...typography.label, color: colors.text },
  description: { ...typography.hint, color: colors.textMuted },
  danger: { color: colors.danger },
});
