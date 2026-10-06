import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "@/components/motion/BrandHeader";
import { FloatingLeaves } from "@/components/motion/FloatingLeaves";
import { Reveal } from "@/components/motion/Reveal";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { backToLogin } from "@/lib/navigation";
import { colors, radius, spacing, typography } from "@/theme";

export default function EmAnaliseScreen() {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  // O relógio "estoura" na tela com uma mola, logo depois da folha se desenhar.
  useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      return;
    }
    const animation = Animated.spring(pop, {
      toValue: 1,
      delay: 500,
      speed: 8,
      bounciness: 14,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, pop]);

  return (
    <Screen edges={["top", "bottom"]}>
      <FloatingLeaves />
      <View style={styles.content}>
        <BrandHeader size="lg" />
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pop }] }]}>
          <Ionicons name="time-outline" size={56} color={colors.warning} />
        </Animated.View>
        <Reveal delay={700} style={styles.texts}>
          <Text style={styles.title}>Conta em Análise</Text>
          <Text style={styles.description}>
            Recebemos seus dados! Estamos conferindo seu documento. Fique de olho no seu{" "}
            <Text style={styles.strong}>e-mail</Text>: avisaremos assim que seu acesso for
            liberado.
          </Text>
        </Reveal>
        <Reveal delay={900} style={styles.action}>
          <Button label="Voltar para o Login" variant="outline" size="lg" onPress={backToLogin} />
        </Reveal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  iconWrapper: {
    padding: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.full,
  },
  texts: { alignItems: "center", gap: spacing.sm },
  title: { ...typography.title, fontSize: 28, color: colors.text, textAlign: "center" },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  strong: { color: colors.text, fontWeight: "700" },
  action: { alignSelf: "stretch" },
});
