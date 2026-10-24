import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { Button } from "@/components/ui/Button";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { colors, elevation, radius, spacing, typography } from "@/theme";

interface ScaleCardProps {
  name: string;
  // O nome original da balança, quando o produtor deu outro nome.
  originalName: string | null;
  isActive: boolean;
  disabled?: boolean;
  onConnect: () => void;
  onRemove: () => void;
}

// Uma balança do produtor. A conectada se destaca: fundo verde, ícone cheio e a etiqueta "Conectada". As outras
// ficam brancas, com o botão para conectar e o de remover.
export function ScaleCard({ name, originalName, isActive, disabled, onConnect, onRemove }: ScaleCardProps) {
  return (
    <View
      accessibilityLabel={isActive ? `${name}, conectada` : name}
      style={[styles.card, isActive ? styles.cardActive : styles.cardIdle]}
    >
      <View style={styles.top}>
        <View style={[styles.tile, isActive ? styles.tileActive : styles.tileIdle]}>
          <Ionicons name="scale" size={24} color={isActive ? colors.primaryContrast : colors.primaryText} />
        </View>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          {originalName && <Text style={styles.original}>{originalName}</Text>}
          {isActive && (
            <View style={styles.pill}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryContrast} />
              <Text style={styles.pillText}>{SCALE_SETUP.connected}</Text>
            </View>
          )}
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${SCALE_SETUP.remove} ${name}`}
          disabled={disabled}
          onPress={onRemove}
          style={styles.remove}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </PressableScale>
      </View>
      {!isActive && (
        <Button label={`${SCALE_SETUP.connect} ${name}`} variant="outline" disabled={disabled} onPress={onConnect} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, boxShadow: elevation.card },
  cardIdle: { backgroundColor: colors.surface },
  cardActive: { backgroundColor: colors.primaryTint },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tile: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
  tileIdle: { backgroundColor: colors.primaryTint },
  tileActive: { backgroundColor: colors.primary },
  text: { flex: 1, gap: 4 },
  name: { ...typography.heading, fontSize: 18, color: colors.text },
  original: { ...typography.hint, color: colors.textMuted },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  pillText: { ...typography.caption, fontWeight: "700", color: colors.primaryContrast },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
