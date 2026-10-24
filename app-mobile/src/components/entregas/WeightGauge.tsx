import { StyleSheet, Text, View } from "react-native";
import type { StageTone } from "@/content/deliveryTexts";
import { formatKg } from "@/lib/format/weight";
import type { WeightRange } from "@/lib/delivery/weight";
import { colors, radius, spacing, typography } from "@/theme";
import { TONE_COLORS } from "./tones";

interface WeightGaugeProps {
  range: WeightRange;
  expectedKg: number;
  // O que já está registrado e, por cima, o lote que está na balança (ainda não registrado).
  registeredKg: number;
  pendingKg: number;
  tone: StageTone;
}

const percent = (value: number, max: number) => `${Math.min(100, Math.max(0, (value / max) * 100))}%` as const;

// Régua do peso: a faixa aceita aparece sombreada e o preenchimento mostra onde o peso está.
export function WeightGauge({ range, expectedKg, registeredKg, pendingKg, tone }: WeightGaugeProps) {
  const total = registeredKg + pendingKg;
  // A régua vai um pouco além do máximo aceito, para dar para ver quando o peso passa dele.
  const axisMax = Math.max(range.maxKg * 1.25, total * 1.05, 0.001);
  const color = TONE_COLORS[tone];

  return (
    <View style={styles.wrapper}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Peso em relação à faixa aceita"
        accessibilityValue={{ min: 0, max: Math.round(axisMax), now: Math.round(total) }}
        style={styles.track}
      >
        <View
          style={[
            styles.zone,
            {
              left: percent(range.minKg, axisMax),
              width: percent(range.maxKg - range.minKg, axisMax),
            },
          ]}
        />
        <View style={[styles.fill, { width: percent(registeredKg, axisMax), backgroundColor: color.strong }]} />
        {pendingKg > 0 && (
          <View
            style={[
              styles.fill,
              styles.pending,
              {
                left: percent(registeredKg, axisMax),
                width: percent(pendingKg, axisMax),
                backgroundColor: color.strong,
              },
            ]}
          />
        )}
        <View style={[styles.mark, { left: percent(expectedKg, axisMax) }]} />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>mín. {formatKg(range.minKg)}</Text>
        <Text style={[styles.legendText, styles.legendStrong]}>ideal {formatKg(expectedKg)}</Text>
        <Text style={styles.legendText}>máx. {formatKg(range.maxKg)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  track: {
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  // A faixa aceita.
  zone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.primaryTint,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.primary,
  },
  fill: { position: "absolute", left: 0, top: 4, bottom: 4, borderRadius: radius.full },
  // O lote ainda não registrado aparece mais claro.
  pending: { opacity: 0.55 },
  // O peso ideal.
  mark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: colors.text,
    opacity: 0.55,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", columnGap: spacing.sm },
  legendText: { ...typography.caption, color: colors.textMuted },
  legendStrong: { fontWeight: "700", color: colors.textStrong },
});
