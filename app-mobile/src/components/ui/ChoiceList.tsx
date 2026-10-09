import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceListProps<T extends string> {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Todas as opções numa lista, uma embaixo da outra e com a bolinha de marcar: nada fica escondido
// nem precisa de rolagem para o lado. Só uma pode estar marcada.
export function ChoiceList<T extends string>({ label, options, value, onChange }: ChoiceListProps<T>) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.list}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              aria-checked={isSelected}
              onPress={() => onChange(option.value)}
              pressedScale={0.985}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={colors.primaryContrast} />}
              </View>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text },
  list: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
  },
  optionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  radio: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionLabel: { ...typography.button, flex: 1, color: colors.textMuted },
  optionLabelSelected: { color: colors.primaryText },
});
