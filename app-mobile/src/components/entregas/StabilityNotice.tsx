import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { STABILITY_TEXTS } from "@/content/deliveryTexts";
import { STABLE_HOLD_SECONDS, type ReadingSpread } from "@/lib/delivery/scale";
import { formatKg } from "@/lib/format/weight";
import { colors, radius, spacing, typography } from "@/theme";
import { TONE_COLORS } from "./tones";

interface StabilityNoticeProps {
  // "irregular": o peso oscila. "holding": parado, contando os 5 s. "ready": ficou firme pelo tempo todo.
  state: "irregular" | "holding" | "ready";
  secondsLeft: number;
  spread: ReadingSpread;
  // No modo rápido o app registra sozinho ao ficar firme; no manual a pessoa toca em Registrar.
  auto: boolean;
}

// O aviso da pesagem até o peso estabilizar: carga irregular (com o quanto oscila) ou a contagem de 5 segundos de peso
// parado. Aparece no lugar do texto de situação da balança.
export function StabilityNotice({ state, secondsLeft, spread, auto }: StabilityNoticeProps) {
  const tone = TONE_COLORS[state === "irregular" ? "warning" : "success"];
  const title =
    state === "irregular"
      ? STABILITY_TEXTS.irregularTitle
      : state === "holding"
        ? STABILITY_TEXTS.holdTitle
        : STABILITY_TEXTS.readyTitle;
  // Para leitor de tela o aviso inclui os segundos que faltam, já que o número fica dentro do anel.
  const spoken = state === "holding" ? STABILITY_TEXTS.holdSpoken(secondsLeft) : title;
  const hint =
    state === "irregular"
      ? STABILITY_TEXTS.irregularHint
      : state === "holding"
        ? STABILITY_TEXTS.holdHint
        : auto
          ? STABILITY_TEXTS.readyAuto
          : STABILITY_TEXTS.readyManual;
  const filled = state === "ready" ? STABLE_HOLD_SECONDS : STABLE_HOLD_SECONDS - secondsLeft;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${spoken}. ${hint}`}
      style={[styles.box, { backgroundColor: colors.surface, borderColor: tone.border }]}
    >
      <View style={styles.row}>
        {state === "irregular" ? (
          <View style={[styles.badge, { backgroundColor: tone.strong }]}>
            <Ionicons name="warning" size={30} color={colors.primaryContrast} />
          </View>
        ) : (
          <CountdownRing filled={filled} color={tone.strong}>
            {state === "ready" ? (
              <Ionicons name="checkmark" size={34} color={tone.strong} />
            ) : (
              <Text style={[styles.count, { color: tone.strong }]}>{secondsLeft}</Text>
            )}
          </CountdownRing>
        )}
        <View style={styles.texts}>
          <Text style={[styles.title, { color: tone.text }]}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </View>

      {state === "irregular" ? <SpreadMeter spread={spread} /> : null}
    </View>
  );
}

// O anel que se fecha: um quinto por segundo de peso parado. Dentro vai o número de segundos que faltam (ou o visto).
const RING_SIZE = 72;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CountdownRing({ filled, color, children }: { filled: number; color: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(filled / STABLE_HOLD_SECONDS)).current;

  useEffect(() => {
    const target = filled / STABLE_HOLD_SECONDS;
    if (reduced) {
      progress.setValue(target);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: target,
      duration: 900,
      easing: Easing.linear,
      useNativeDriver: false, // propriedade do SVG não aceita driver nativo
    });
    animation.start();
    return () => animation.stop();
  }, [filled, reduced, progress]);

  return (
    <View style={styles.ring}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={colors.border} strokeWidth={RING_STROKE} fill="none" />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [RING_LENGTH, 0] })}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// O quanto o peso oscila: a barra enche conforme a variação cresce e o risco marca o limite aceito. Passou do risco =
// carga irregular.
const METER_SCALE = 4;

function SpreadMeter({ spread }: { spread: ReadingSpread }) {
  const ratio = spread.allowedKg > 0 ? spread.spreadKg / (spread.allowedKg * METER_SCALE) : 0;
  const warn = TONE_COLORS.warning;
  return (
    <View style={styles.meterBlock}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Variação do peso"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(1, ratio) * 100) }}
        style={styles.meter}
      >
        <View style={[styles.meterFill, { width: `${Math.min(1, ratio) * 100}%`, backgroundColor: warn.strong }]} />
        <View style={[styles.meterLimit, { left: `${100 / METER_SCALE}%` }]} />
      </View>
      <View style={styles.meterLegend}>
        <Text style={[styles.meterText, { color: warn.text }]}>
          {STABILITY_TEXTS.spread(formatKg(spread.spreadKg))}
        </Text>
        <Text style={styles.meterText}>{STABILITY_TEXTS.limit(formatKg(spread.allowedKg))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignSelf: "stretch", gap: spacing.sm, padding: spacing.sm + 4, borderWidth: 2, borderRadius: radius.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  badge: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  ring: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute" },
  count: { fontSize: 32, lineHeight: 36, fontWeight: "800", ...typography.numeric },
  texts: { flex: 1, gap: 2 },
  title: { ...typography.label, fontSize: 17 },
  hint: { ...typography.hint, color: colors.textMuted },
  meterBlock: { gap: 4 },
  meter: { height: 10, borderRadius: radius.full, backgroundColor: colors.border, overflow: "hidden" },
  meterFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: radius.full },
  meterLimit: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: colors.text },
  meterLegend: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  meterText: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
});
