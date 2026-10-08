import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";

interface StatTileProps {
  icon: ComponentProps<typeof Ionicons>["name"];
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
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  icon: { alignSelf: "flex-start", padding: 8, borderRadius: radius.full, backgroundColor: colors.primaryTint },
  value: { fontSize: 30, lineHeight: 36, fontWeight: "900", color: colors.text },
  label: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
});
