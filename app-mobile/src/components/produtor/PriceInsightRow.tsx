import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { ADVICE_TEXTS, changeLabel, POSITION_TEXTS, SALES_SIGNAL_LABELS } from "@/content/priceTexts";
import { formatBRL } from "@/lib/format/currency";
import type { PriceInsight, SalesSignal } from "@/lib/pricing/insights";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

const SIGNAL_LOOK: Record<SalesSignal, { icon: IconName; color: string; background: string }> = {
  up: { icon: "trending-up", color: colors.primaryText, background: colors.primaryTint },
  steady: { icon: "remove", color: colors.textStrong, background: colors.borderMid },
  down: { icon: "trending-down", color: colors.dangerText, background: colors.dangerSoft },
};

interface PriceInsightRowProps {
  insight: PriceInsight;
}

// Um produto do Painel: se está vendendo mais ou menos, as médias de preço e como o preço do produtor se encaixa.
export function PriceInsightRow({ insight }: PriceInsightRowProps) {
  const look = SIGNAL_LOOK[insight.signal];
  const change = changeLabel(insight.change);
  const signalText = `${SALES_SIGNAL_LABELS[insight.signal]}${change ? ` ${change}` : ""}`;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.product}>{insight.produto}</Text>
        <View style={[styles.signal, { backgroundColor: look.background }]} accessibilityLabel={signalText}>
          <Ionicons name={look.icon} size={16} color={look.color} />
          <Text style={[styles.signalText, { color: look.color }]}>{signalText}</Text>
        </View>
      </View>

      <View style={styles.figures}>
        <Figure label="Média pedida" value={insight.averageAsked === null ? "—" : formatBRL(insight.averageAsked)} />
        <Figure label="Média vendida" value={insight.averageSold === null ? "—" : formatBRL(insight.averageSold)} />
        <Figure label="Seu preço" value={insight.myPrice === null ? "—" : formatBRL(insight.myPrice)} />
      </View>

      <Text style={styles.units}>
        {insight.soldUnits} {insight.soldUnits === 1 ? "unidade vendida" : "unidades vendidas"} no período
      </Text>
      <Text style={styles.position}>{POSITION_TEXTS[insight.position]}</Text>
      <View style={styles.advice}>
        <Ionicons name="bulb-outline" size={16} color={colors.warningStrong} />
        <Text style={styles.adviceText}>{ADVICE_TEXTS[insight.advice]}</Text>
      </View>
    </View>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.figure}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={styles.figureValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  product: { fontSize: 18, fontWeight: "900", color: colors.text },
  signal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  signalText: { fontSize: 13, fontWeight: "800" },
  figures: { flexDirection: "row", gap: spacing.sm },
  figure: { flex: 1, gap: 2 },
  figureLabel: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
  figureValue: { fontSize: 16, fontWeight: "900", color: colors.textStrong },
  units: { ...typography.hint, color: colors.textMuted },
  position: { ...typography.hint, fontWeight: "700", color: colors.textStrong },
  advice: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  adviceText: { ...typography.hint, flex: 1, color: colors.warningText },
});
