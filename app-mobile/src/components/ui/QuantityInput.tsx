import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { useHoldRepeat } from "@/hooks/useHoldRepeat";
import { clampQuantity } from "@/lib/produtor/quantity";
import { heldValue } from "@/lib/produtor/holdRepeat";
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
  // Chamado a cada passo; devolve true se ainda dá para continuar (usado ao segurar o botão).
  onStep: (tick: number) => boolean;
}

function StepButton({ icon, label, disabled, onStep }: StepButtonProps) {
  const hold = useHoldRepeat(onStep, disabled);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Toque para mudar de um em um. Segure para mudar mais rápido."
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={hold.onPressIn}
      onPressOut={hold.onPressOut}
      onPress={hold.onPress}
      style={[styles.step, disabled && styles.stepDisabled]}
    >
      <Ionicons name={icon} size={22} color={colors.textMuted} />
    </PressableScale>
  );
}

// Campo de quantidade com botões de mais e menos (botões grandes, fáceis de acertar com o dedo).
// Segurar um botão muda o número sozinho, cada vez mais rápido, e nunca passa do limite.
export function QuantityInput({ value, onChange, max, label }: QuantityInputProps) {
  const change = (next: number) => onChange(clampQuantity(next, max));
  // Valor mais recente: ao segurar, os passos vêm mais rápido que a tela atualiza.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const stepper = (direction: 1 | -1) => (tick: number) => {
    const next = heldValue(latest.current, direction, tick, max);
    latest.current = next.value;
    onChange(next.value);
    return !next.done;
  };

  return (
    <View style={styles.container}>
      <StepButton icon="remove" label={`Diminuir ${label}`} disabled={value <= 0} onStep={stepper(-1)} />
      <TextInput
        accessibilityLabel={label}
        value={String(value)}
        onChangeText={(text) => change(Number(text.replace(/\D/g, "")))}
        keyboardType="number-pad"
        selectTextOnFocus
        style={styles.input}
      />
      <StepButton icon="add" label={`Aumentar ${label}`} disabled={value >= max} onStep={stepper(1)} />
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
