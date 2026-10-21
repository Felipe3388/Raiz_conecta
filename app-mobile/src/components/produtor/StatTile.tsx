import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, elevation, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

interface StatTileProps {
  icon: IconName;
  value: number;
  label: string;
  onPress: () => void;
}

// Um número do painel; tocar nele leva para a tela onde esse número nasce.
export function StatTile({ icon, value, label, onPress }: StatTileProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Toque para abrir.`}
      onPress={onPress}
      containerStyle={styles.container}
      style={styles.tile}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.primaryText} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tile: {
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md - 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  icon: { alignSelf: "flex-start", padding: 8, borderRadius: radius.md - 4, backgroundColor: colors.primaryTint },
  value: { ...typography.title, ...typography.numeric, color: colors.text },
  label: { ...typography.hint, fontWeight: "600", color: colors.textMuted },
});
