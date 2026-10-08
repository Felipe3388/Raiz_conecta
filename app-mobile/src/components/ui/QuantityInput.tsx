import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { clampQuantity } from "@/lib/produtor/demands";
import { colors, radius, spacing } from "@/theme";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  // Lido por quem usa leitor de tela: "Quantidade de Tomate".
  label: string;
}

interface StepButtonProps {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}

function StepButton({ icon, label, disabled, onPress }: StepButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, disabled && styles.stepDisabled]}
    >
      <Ionicons name={icon} size={22} color={colors.textMuted} />
    </PressableScale>
  );
}

// Campo de quantidade com botões de mais e menos (botões grandes, fáceis de acertar com o dedo).
export function QuantityInput({ value, onChange, max, label }: QuantityInputProps) {
  const change = (next: number) => onChange(clampQuantity(next, max));

  return (
    <View style={styles.container}>
      <StepButton icon="remove" label={`Diminuir ${label}`} disabled={value <= 0} onPress={() => change(value - 1)} />
      <TextInput
        accessibilityLabel={label}
        value={String(value)}
        onChangeText={(text) => change(Number(text.replace(/\D/g, "")))}
        keyboardType="number-pad"
        selectTextOnFocus
        style={styles.input}
      />
      <StepButton icon="add" label={`Aumentar ${label}`} disabled={value >= max} onPress={() => change(value + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    padding: 4,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
  },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md - 2,
    backgroundColor: colors.surfaceMuted,
  },
  stepDisabled: { opacity: 0.4 },
  input: {
    flex: 1,
    minWidth: 40,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    outlineWidth: 0,
  },
});
