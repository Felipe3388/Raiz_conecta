import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, elevation, radius, spacing, typography } from "@/theme";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: "green" | "amber";
}

// Chips "cheios": o selecionado é sólido e os outros são cinza claro, sem bordas pesadas.
const ACCENTS = {
  green: { on: colors.primary, onText: colors.primaryContrast, off: colors.surface, countOff: colors.background },
  amber: {
    on: colors.warningStrong,
    onText: colors.primaryContrast,
    off: colors.surface,
    countOff: colors.warningSoft,
  },
};

// Filtros em fileira (Todos, Selecionados...), com a quantidade de cada um. Rola de lado se faltar espaço.
export function FilterChips<T extends string>({ options, value, onChange, accent = "green" }: FilterChipsProps<T>) {
  const tone = ACCENTS[accent];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.count === undefined ? option.label : `${option.label}, ${option.count}`}
            aria-checked={isSelected}
            onPress={() => onChange(option.value)}
            style={[styles.chip, { backgroundColor: isSelected ? tone.on : tone.off }, !isSelected && styles.chipOff]}
          >
            <Text style={[styles.label, { color: isSelected ? tone.onText : colors.textStrong }]}>{option.label}</Text>
            {option.count !== undefined && (
              <View style={[styles.count, { backgroundColor: isSelected ? "rgba(255,255,255,0.28)" : tone.countOff }]}>
                <Text style={[styles.countText, { color: isSelected ? tone.onText : colors.textStrong }]}>
                  {option.count}
                </Text>
              </View>
            )}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm + 2,
    borderRadius: radius.full,
  },
  chipOff: { boxShadow: elevation.card },
  label: { ...typography.button, fontSize: 15 },
  count: { minWidth: 26, alignItems: "center", paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.full },
  countText: { fontSize: 13, fontWeight: "700" },
});
