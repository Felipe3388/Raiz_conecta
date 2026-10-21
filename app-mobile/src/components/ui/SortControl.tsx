import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, typography } from "@/theme";
import { ChoiceSheet, type ChoiceOption } from "./ChoiceSheet";

interface SortControlProps<T extends string> {
  options: ChoiceOption<T>[];
  value: T;
  // Opção que não muda nada na lista; só as outras destacam o botão.
  defaultValue: T;
  onChange: (value: T) => void;
  accent?: "green" | "amber";
}

const ACCENTS = {
  green: {
    border: colors.borderStrong,
    activeBg: colors.primarySoft,
    activeBorder: colors.primary,
    text: colors.primaryText,
  },
  amber: {
    border: colors.warningBorder,
    activeBg: colors.warningTint,
    activeBorder: colors.warning,
    text: colors.warningText,
  },
};

// Botão "Ordenar": abre a lista de ordens. Fica destacado quando a lista não está na ordem padrão.
export function SortControl<T extends string>({
  options,
  value,
  defaultValue,
  onChange,
  accent = "green",
}: SortControlProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const tone = ACCENTS[accent];
  const isActive = value !== defaultValue;
  const current = options.find((option) => option.value === value)?.label;

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={isActive && current ? `Ordenar. Ordem atual: ${current}` : "Ordenar"}
        onPress={() => setIsOpen(true)}
        style={[
          styles.button,
          {
            borderColor: isActive ? tone.activeBorder : tone.border,
            backgroundColor: isActive ? tone.activeBg : colors.surface,
          },
        ]}
      >
        <Ionicons name="swap-vertical-outline" size={20} color={isActive ? tone.text : colors.textMuted} />
        <Text style={[styles.label, { color: isActive ? tone.text : colors.textStrong }]}>Ordenar</Text>
      </PressableScale>
      <ChoiceSheet
        visible={isOpen}
        title="Ordenar por"
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  label: { ...typography.button },
});
