import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";
import { BottomSheet } from "./BottomSheet";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: ChoiceOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

// Lista de opções numa folha: toca, escolhe e a folha fecha.
export function ChoiceSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: ChoiceSheetProps<T>) {
  return (
    <BottomSheet visible={visible} title={title} icon="swap-vertical-outline" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.list}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              aria-checked={isSelected}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={colors.primaryContrast} />}
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
  },
  optionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  label: { ...typography.label, flex: 1, color: colors.textStrong },
  labelSelected: { color: colors.primaryText },
  radio: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
