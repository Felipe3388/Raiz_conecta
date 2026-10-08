import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface ViewOption<T extends string> {
  value: T;
  label: string;
  icon: IconName;
}

interface ViewToggleProps<T extends string> {
  options: ViewOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: "green" | "amber";
}

const ACCENTS = {
  green: { on: colors.primarySoft, onText: colors.primaryText, border: colors.borderStrong, onBorder: colors.primary },
  amber: { on: colors.warningTint, onText: colors.warningText, border: colors.warningBorder, onBorder: colors.warning },
};

// Duas formas de ver a mesma lista (ex.: Grade e Detalhes): o botão ativo fica colorido.
export function ViewToggle<T extends string>({ options, value, onChange, accent = "green" }: ViewToggleProps<T>) {
  const tone = ACCENTS[accent];

  return (
    <View style={[styles.group, { borderColor: tone.border }]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            aria-checked={isSelected}
            onPress={() => onChange(option.value)}
            style={[styles.option, isSelected && { backgroundColor: tone.on, borderColor: tone.onBorder }]}
          >
            <Ionicons name={option.icon} size={20} color={isSelected ? tone.onText : colors.textMuted} />
            <Text style={[styles.label, { color: isSelected ? tone.onText : colors.textMuted }]}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", padding: 2, backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: radius.md },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    minHeight: 40,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: radius.md - 3,
  },
  label: { ...typography.button, fontSize: 15 },
});
