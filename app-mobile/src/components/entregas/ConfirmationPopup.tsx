import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { CELEBRATION_TEXTS } from "@/content/deliveryTexts";
import type { Celebration } from "@/hooks/useWeighRun";
import { CELEBRATION_FADE_OUT_MS, CELEBRATION_MS } from "@/lib/delivery/session";
import { colors, elevation, radius, spacing, typography } from "@/theme";

const FADE_IN_MS = 350;
const HOLD_UNTIL_MS = CELEBRATION_MS - CELEBRATION_FADE_OUT_MS;
const TOTAL_SECONDS = Math.ceil(CELEBRATION_MS / 1000);

// O pop-up verde de confirmação: "produto pesado" ou "pedido fechado". Cobre a tela por 10 segundos com o aviso de
// retirar a carga da balança e a contagem até o próximo. O conteúdo de baixo troca logo no começo, escondido por ele, e
// no fim ele some devagar, revelando o próximo produto aos poucos. Com "reduzir animações" aparece e some sem
// movimento, mas pelo mesmo tempo.
export function ConfirmationPopup({ celebration }: { celebration: Celebration }) {
  const reduced = useReducedMotion();
  const fade = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(reduced ? 1 : 0.85)).current;
  const timer = useRef(new Animated.Value(0)).current;
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);

  useEffect(() => {
    setSeconds(TOTAL_SECONDS);
    const tick = setInterval(() => setSeconds((left) => Math.max(left - 1, 0)), 1000);
    return () => clearInterval(tick);
  }, [celebration.id]);

  useEffect(() => {
    timer.setValue(0);
    const fill = Animated.timing(timer, {
      toValue: 1,
      duration: CELEBRATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    if (reduced) {
      fade.setValue(1);
      pop.setValue(1);
      fill.start();
      const hide = setTimeout(() => fade.setValue(0), CELEBRATION_MS - 50);
      return () => {
        clearTimeout(hide);
        fill.stop();
      };
    }
    fade.setValue(0);
    pop.setValue(0.85);
    const run = Animated.parallel([
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.delay(HOLD_UNTIL_MS - FADE_IN_MS),
        Animated.timing(fade, {
          toValue: 0,
          duration: CELEBRATION_FADE_OUT_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 120, useNativeDriver: USE_NATIVE_DRIVER }),
      // A barrinha de baixo enche durante os 10 segundos: mostra quanto falta para o próximo.
      fill,
    ]);
    run.start();
    return () => run.stop();
  }, [celebration.id, reduced, fade, pop, timer]);

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${celebration.title} ${celebration.detail}. ${celebration.notice} ${celebration.next}`}
      style={[styles.overlay, { opacity: fade }]}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={52} color={colors.primaryContrast} />
        </View>
        <Text style={styles.title}>{celebration.title}</Text>
        <Text style={styles.detail}>{celebration.detail}</Text>
        <View style={styles.notice}>
          <Ionicons name="scale-outline" size={22} color={colors.warningDark} />
          <Text style={styles.noticeText}>{celebration.notice}</Text>
        </View>
        <Text style={styles.next}>{celebration.next}</Text>
        <Text style={styles.count} accessibilityElementsHidden importantForAccessibility="no">
          {CELEBRATION_TEXTS.countdown(seconds)}
        </Text>
        <View style={styles.track}>
          <Animated.View
            style={[styles.fill, { width: timer.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Quase opaco: o conteúdo de baixo troca escondido por ele.
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(242, 244, 242, 0.96)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryTint,
    boxShadow: elevation.raised,
  },
  check: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  title: { ...typography.heading, fontSize: 26, lineHeight: 32, textAlign: "center", color: colors.primaryText },
  detail: { fontSize: 20, lineHeight: 26, fontWeight: "700", ...typography.numeric, color: colors.textStrong },
  // O aviso junto da confirmação: retirar a carga da balança.
  notice: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warningBorderStrong,
    backgroundColor: colors.warningSoft,
  },
  noticeText: { ...typography.label, flexShrink: 1, textAlign: "center", color: colors.warningDark },
  next: { ...typography.body, textAlign: "center", color: colors.textMuted },
  count: { ...typography.label, ...typography.numeric, color: colors.primaryText },
  track: {
    alignSelf: "stretch",
    height: 6,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryBorder,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
});
