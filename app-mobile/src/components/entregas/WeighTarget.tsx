import { StyleSheet, Text, View } from "react-native";
import { RUN_TEXTS } from "@/content/deliveryTexts";
import type { StageTone } from "@/content/deliveryTexts";
import { formatKg, formatPercent } from "@/lib/format/weight";
import {
  MIN_WEIGHING_KG,
  tolerancePercent,
  type WeightRange,
} from "@/lib/delivery/weight";
import { colors, radius, spacing, typography } from "@/theme";
import { WeightGauge } from "./WeightGauge";

interface WeighTargetProps {
  produto: string;
  // O peso que o mercado pediu (o número que o produtor precisa conseguir na balança).
  expectedKg: number;
  range: WeightRange;
  // O que já foi registrado deste produto e o lote que está na balança agora.
  registeredKg: number;
  pendingKg: number;
  tone: StageTone;
}

// O que pesar, em destaque: o produto, o peso que o mercado pediu em letra grande, a tolerância e a faixa aceita.
// Embaixo, a régua mostra onde a balança está em relação à faixa (a mesma régua da folha de pesagem).
export function WeighTarget({
  produto,
  expectedKg,
  range,
  registeredKg,
  pendingKg,
  tone,
}: WeighTargetProps) {
  const percent = formatPercent(tolerancePercent(expectedKg, range));
  const requested = formatKg(expectedKg);
  // Pedidos pequenos (perto de 1 kg) têm o limite de baixo no mínimo para registrar, e não nos 2%.
  const atMinimum = range.minKg <= MIN_WEIGHING_KG;

  return (
    <View style={styles.wrapper}>
      <Text accessibilityRole="header" style={styles.productName}>
        {produto}
      </Text>
      <View
        accessible
        accessibilityLabel={`${RUN_TEXTS.requestedSpoken(requested)}. ${RUN_TEXTS.tolerance(percent)}.`}
        style={styles.card}
      >
        <Text style={styles.label}>{RUN_TEXTS.requested}</Text>
        <Text style={styles.requested} adjustsFontSizeToFit numberOfLines={1}>
          {requested}
        </Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{RUN_TEXTS.tolerance(percent)}</Text>
        </View>
      </View>
      <View style={styles.accepted}>
        <Text style={styles.acceptedTitle}>{RUN_TEXTS.acceptedTitle}</Text>
        <Text style={styles.acceptedRange}>
          {RUN_TEXTS.acceptedRange(
            formatKg(range.minKg),
            formatKg(range.maxKg),
          )}
        </Text>
      </View>
      <WeightGauge
        range={range}
        expectedKg={expectedKg}
        registeredKg={registeredKg}
        pendingKg={pendingKg}
        tone={tone}
        showLegend={false}
      />
      {atMinimum && (
        <Text style={styles.note}>
          {RUN_TEXTS.minimumNote(formatKg(MIN_WEIGHING_KG))}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm, alignItems: "stretch" },
  productName: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  card: {
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  label: { ...typography.sectionHeader, color: colors.primaryText },
  requested: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "800",
    ...typography.numeric,
    color: colors.primaryPressed,
  },
  chip: {
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: { ...typography.label, fontSize: 15, color: colors.primaryText },
  accepted: { alignItems: "center", gap: 2 },
  acceptedTitle: { ...typography.hint, color: colors.textMuted },
  acceptedRange: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    ...typography.numeric,
    color: colors.textStrong,
  },
  note: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
});
