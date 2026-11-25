import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, spacing, typography } from "@/theme";

interface ScaleCardProps {
  name: string;
  originalName: string | null;
  isActive: boolean;
  disabled?: boolean;
  onConnect: () => void;
  onRemove: () => void;
}

// One saved device per row, as in a Wi-Fi settings list. Pairing is managed by the existing API.
export function ScaleCard({ name, originalName, isActive, disabled, onConnect, onRemove }: ScaleCardProps) {
  return (
    <View style={[styles.row, isActive && styles.active]} accessibilityLabel={`${name}, ${isActive ? "selecionada" : "não selecionada"}`}>
      <PressableScale accessibilityRole="button"
        accessibilityLabel={isActive ? `${name}, selecionada` : `Conectar ${name}`}
        disabled={disabled || isActive} onPress={onConnect} style={styles.connect}>
        <Ionicons name={isActive ? "wifi" : "wifi-outline"} size={24} color={isActive ? colors.primary : colors.textMuted} />
        <View style={styles.description}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={[styles.caption, isActive && styles.connected]}>
            {isActive ? "Selecionada para pesagem" : (originalName ? `${originalName} · Toque para conectar` : "Salva · Toque para conectar")}
          </Text>
        </View>
        {isActive ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          : <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
      </PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Remover ${name}`}
        disabled={disabled} onPress={onRemove} style={styles.delete}>
        <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  active: { backgroundColor: colors.primaryTint },
  connect: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, paddingLeft: spacing.md },
  description: { flex: 1, gap: 4 },
  name: { ...typography.label, color: colors.text },
  caption: { ...typography.hint, color: colors.textMuted },
  connected: { fontWeight: "700", color: colors.primary },
  delete: { width: 50, justifyContent: "center", alignItems: "center" },
});
