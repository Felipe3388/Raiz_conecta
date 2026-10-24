import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";
import { FadeSwap } from "@/components/motion/FadeSwap";
import { PressableScale } from "@/components/motion/PressableScale";
import { useAnimatedColor } from "@/components/motion/useAnimatedColor";
import { canRegister, type RegisterState } from "@/lib/delivery/registerState";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

interface Look {
  background: string;
  text: string;
  icon?: IconName;
}

// Cada estado tem a sua cor: verde para registrar, laranja para o que está bloqueado por falta (carga irregular, abaixo do
// mínimo), vermelho para o que passou do pedido. A cor muda aos poucos, nunca de uma vez.
const LOOKS: Record<RegisterState, Look> = {
  empty: { background: colors.borderMid, text: colors.textMuted },
  irregular: { background: colors.warningStrong, text: colors.primaryContrast, icon: "lock-closed" },
  holding: { background: colors.primaryTint, text: colors.primaryText, icon: "time-outline" },
  below: { background: colors.warningStrong, text: colors.primaryContrast, icon: "arrow-down-circle" },
  above: { background: colors.danger, text: colors.primaryContrast, icon: "arrow-up-circle" },
  ready: { background: colors.primary, text: colors.primaryContrast },
};

interface RegisterButtonProps {
  state: RegisterState;
  label: string;
  isLoading?: boolean;
  onPress: () => void;
}

// O botão de registrar o peso. Bloqueado (mas legível, sem esmaecer) enquanto a carga é irregular, o peso não firmou, ou
// o total está fora da faixa; verde quando pode registrar.
export function RegisterButton({ state, label, isLoading = false, onPress }: RegisterButtonProps) {
  const look = LOOKS[state];
  const background = useAnimatedColor(look.background);
  const text = useAnimatedColor(look.text);
  const blocked = !canRegister(state) || isLoading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
    >
      <Animated.View style={[styles.base, { backgroundColor: background }]}>
        <FadeSwap swapKey={`${state}-${isLoading}`}>
          <View style={styles.content}>
            {isLoading ? (
              <ActivityIndicator color={look.text} size="small" />
            ) : (
              look.icon && <Ionicons name={look.icon} size={20} color={look.text} />
            )}
            {/* O texto só muda quando o estado muda; a contagem do "Aguarde 3 s" se atualiza sem piscar. */}
            <Animated.Text style={[styles.label, { color: text }]}>{label}</Animated.Text>
          </View>
        </FadeSwap>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  label: { ...typography.button },
});
