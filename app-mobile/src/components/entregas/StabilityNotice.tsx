import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
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
        ? STABILITY_TEXTS.holdTitle(secondsLeft)
        : STABILITY_TEXTS.readyTitle;
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
      accessibilityLabel={`${title}. ${hint}`}
      style={[styles.box, { backgroundColor: colors.surface, borderColor: tone.border }]}
    >
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: tone.strong }]}>
          {state === "irregular" ? (
            <Ionicons name="warning" size={26} color={colors.primaryContrast} />
          ) : state === "ready" ? (
            <Ionicons name="checkmark" size={30} color={colors.primaryContrast} />
          ) : (
            <Text style={styles.count}>{secondsLeft}</Text>
          )}
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, { color: tone.text }]}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </View>

      {state === "irregular" ? (
        <SpreadMeter spread={spread} />
      ) : (
        // Cinco tracinhos, um por segundo de peso parado; enchem até a contagem acabar.
        <View style={styles.dots}>
          {Array.from({ length: STABLE_HOLD_SECONDS }, (_unused, index) => (
            <View key={index} style={[styles.dot, { backgroundColor: index < filled ? tone.strong : colors.border }]} />
          ))}
        </View>
      )}
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
  badge: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  count: { fontSize: 26, lineHeight: 30, fontWeight: "700", ...typography.numeric, color: colors.primaryContrast },
  texts: { flex: 1, gap: 2 },
  title: { ...typography.label, fontSize: 17 },
  hint: { ...typography.hint, color: colors.textMuted },
  dots: { flexDirection: "row", gap: spacing.xs },
  dot: { flex: 1, height: 8, borderRadius: radius.full },
  meterBlock: { gap: 4 },
  meter: { height: 10, borderRadius: radius.full, backgroundColor: colors.border, overflow: "hidden" },
  meterFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: radius.full },
  meterLimit: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: colors.text },
  meterLegend: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  meterText: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
});
