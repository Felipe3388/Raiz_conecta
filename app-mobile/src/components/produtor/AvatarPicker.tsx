import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { AVATAR_EMOJIS } from "@/lib/produtor/avatar";
import { colors, radius, spacing, typography } from "@/theme";

interface AvatarPickerProps {
  initials: string;
  // Ícone escolhido agora (null = iniciais).
  value: string | null;
  onChange: (emoji: string | null) => void;
}

const OPTION_SIZE = 56;

// "Seu ícone": as iniciais ou um dos desenhos do campo. A escolha vale na hora e fica no aparelho.
export function AvatarPicker({ initials, value, onChange }: AvatarPickerProps) {
  const options = [
    { key: "initials", emoji: null, label: `Usar minhas iniciais, ${initials}`, content: initials },
    ...AVATAR_EMOJIS.map(({ emoji, label }) => ({ key: emoji, emoji, label: `Ícone ${label}`, content: emoji })),
  ];

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Seu ícone" style={styles.grid}>
      {options.map((option) => {
        const isSelected = option.emoji === value;
        return (
          <PressableScale
            key={option.key}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            aria-checked={isSelected}
            onPress={() => onChange(option.emoji)}
            style={[styles.option, isSelected && styles.selected]}
          >
            <Text style={[styles.content, option.emoji === null && styles.initials]}>{option.content}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm + 2 },
  option: {
    width: OPTION_SIZE,
    height: OPTION_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, borderWidth: 3, backgroundColor: colors.primarySoft },
  content: { fontSize: 28 },
  initials: { ...typography.label, fontSize: 20, fontWeight: "900", color: colors.primaryText },
});
