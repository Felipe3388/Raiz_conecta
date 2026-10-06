import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LeafIcon } from "@/components/motion/LeafIcon";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { colors, radius, spacing, typography } from "@/theme";

const LEAF_SIZE = 26;

// Barra de passos com uma folhinha que "caminha" até o ponto atual.
export function StepProgress({ step, total }: { step: number; total: number }) {
  const reduced = useReducedMotion();
  const target = step / total;
  const fraction = useRef(new Animated.Value(reduced ? target : (step - 1) / total)).current;

  useEffect(() => {
    if (reduced) {
      fraction.setValue(target);
      return;
    }
    const animation = Animated.timing(fraction, {
      toValue: target,
      duration: 800,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // largura e posição em % não aceitam driver nativo
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, target, fraction]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Passo {step} de {total}
      </Text>
      <View style={styles.track}>
        <View style={styles.rail} />
        <Animated.View
          style={[styles.fill, { width: fraction.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
        />
        <Animated.View
          style={[
            styles.leaf,
            { left: fraction.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        >
          <LeafIcon size={LEAF_SIZE} color={colors.primaryPressed} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.hint, color: colors.textMuted, fontWeight: "700" },
  track: {
    height: LEAF_SIZE,
    justifyContent: "center",
    marginRight: LEAF_SIZE / 2,
  },
  // Trilho cinza: mostra quanto falta para terminar.
  rail: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  leaf: { position: "absolute", marginLeft: -LEAF_SIZE / 2, top: 0 },
});
