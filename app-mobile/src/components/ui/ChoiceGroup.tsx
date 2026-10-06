import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  // Frase curta que explica a opção (só no layout "cards").
  description?: string;
}

interface ChoiceGroupProps<T extends string> {
  label?: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // "cards": opções grandes lado a lado, com ícone. "chips": opções compactas que quebram de linha.
  layout?: "cards" | "chips";
}

export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = "chips",
}: ChoiceGroupProps<T>) {
  const isCards = layout === "cards";

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={isCards ? styles.cards : styles.chips}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(option.value)}
              containerStyle={isCards ? styles.cardContainer : undefined}
              style={[isCards ? styles.card : styles.chip, isSelected && styles.selected]}
            >
              {option.icon && <Text style={styles.icon}>{option.icon}</Text>}
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              {option.description && isCards && (
                <Text style={styles.description}>{option.description}</Text>
              )}
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
  cards: { flexDirection: "row", gap: spacing.sm },
  cardContainer: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  icon: { fontSize: 32 },
  optionLabel: { ...typography.button, color: colors.textMuted, textAlign: "center" },
  optionLabelSelected: { color: colors.primaryText },
  description: { ...typography.hint, color: colors.textMuted, textAlign: "center" },
});
