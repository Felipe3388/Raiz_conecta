import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STAGE_INFO, verdictSummary } from "@/content/deliveryTexts";
import type { DeliveryCard } from "@/lib/delivery/card";
import { formatBRL } from "@/lib/format/currency";
import { formatKg, formatPercent } from "@/lib/format/weight";
import { productEmoji } from "@/lib/produtor/productVisual";
import { colors, radius, spacing, typography } from "@/theme";
import { StageBadge } from "./StageBadge";
import { TONE_COLORS } from "./tones";

interface DeliveryCardViewProps {
  card: DeliveryCard;
  onWeigh: () => void;
  onHandOver: () => void;
  // Só no modo simulado: faz de conta que o mercado pesou ao receber.
  onSimulateReceipt?: () => void;
}

// Um pedido a entregar: o que e quanto, em que etapa está, quanto já foi pesado e o que fazer agora.
export function DeliveryCardView({ card, onWeigh, onHandOver, onSimulateReceipt }: DeliveryCardViewProps) {
  const { delivery, stage, actions } = card;
  const info = STAGE_INFO[stage];
  const tone = TONE_COLORS[info.tone];
  const canWeigh = actions.includes("WEIGH");
  const canHandOver = actions.includes("HAND_OVER");
  const waitingMarket = actions.includes("RECEIVE");

  return (
    <View style={[styles.card, { borderColor: tone.border }]}>
      <View style={styles.top}>
        <View style={styles.emoji}>
          <Text maxFontSizeMultiplier={1} style={styles.emojiText}>
            {productEmoji(delivery.produto)}
          </Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.product}>{delivery.produto}</Text>
          <Text style={styles.detail}>
            {delivery.quantidade} {delivery.unidade.toLowerCase()} · {formatKg(card.expectedKg)}
          </Text>
        </View>
        <StageBadge stage={stage} />
      </View>

      <View style={styles.when}>
        <Text style={[styles.day, card.late && styles.late]}>
          {card.late ? `Atrasada · era para ${card.dayLabel.toLowerCase()}` : `Entrega: ${card.dayLabel.toLowerCase()}`}
        </Text>
        {card.value !== null && (
          <Text style={styles.value}>
            {formatBRL(card.value)}{" "}
            <Text style={styles.valueNote}>{card.valueConfirmed ? "conferido" : "estimado"}</Text>
          </Text>
        )}
      </View>

      {stage !== "RECEBIDA" && stage !== "DIVERGENTE" && (
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Pesado: <Text style={styles.progressStrong}>{formatKg(card.weighedKg)}</Text> de{" "}
              {formatKg(card.expectedKg)}
            </Text>
            {card.weighedKg > 0 && (
              <Text
                style={[
                  styles.verdict,
                  { color: TONE_COLORS[card.weighing.verdict === "NA_FAIXA" ? "success" : "warning"].text },
                ]}
              >
                {verdictSummary(card.weighing)}
              </Text>
            )}
          </View>
          <ProgressBar
            value={card.percent}
            color={card.weighing.verdict === "NA_FAIXA" ? colors.primary : colors.warning}
          />
        </View>
      )}

      {card.receipt && delivery.receipt && (
        <View style={[styles.receipt, { backgroundColor: tone.soft, borderColor: tone.border }]}>
          <Text style={[styles.receiptTitle, { color: tone.text }]}>
            O mercado pesou {formatKg(delivery.receipt.kg)} ({formatPercent(card.receipt.diffPercent)})
          </Text>
          <Text style={[styles.receiptText, { color: tone.text }]}>{verdictSummary(card.receipt)}</Text>
        </View>
      )}

      <Text style={styles.hint}>
        {card.sentOutOfRange && stage === "COM_LOGISTICA"
          ? "Entregue com o peso fora da faixa. O mercado foi avisado."
          : info.hint}
      </Text>

      {(canWeigh || canHandOver || waitingMarket) && (
        <View style={styles.actions}>
          {canWeigh && (
            <Button
              label={card.weighedKg > 0 ? "Pesar mais" : "Pesar"}
              variant={canHandOver && card.weighing.verdict === "NA_FAIXA" ? "outline" : "primary"}
              onPress={onWeigh}
            />
          )}
          {canHandOver && (
            <Button
              label="Entregar à logística"
              variant={card.weighing.verdict === "NA_FAIXA" ? "primary" : "amberOutline"}
              onPress={onHandOver}
            />
          )}
          {waitingMarket && onSimulateReceipt && (
            <Button label="Simular pesagem do mercado" variant="amberOutline" onPress={onSimulateReceipt} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm + 4,
    padding: spacing.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg + 4,
  },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  emoji: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  emojiText: { fontSize: 26 },
  titleBlock: { flex: 1, gap: 2 },
  product: { fontSize: 22, fontWeight: "900", color: colors.text },
  detail: { ...typography.hint, color: colors.textMuted },
  when: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  day: { ...typography.hint, fontWeight: "800", color: colors.textStrong, flexShrink: 1 },
  late: { color: colors.danger },
  value: { fontSize: 17, fontWeight: "900", color: colors.primaryPressed },
  valueNote: { fontSize: 12, fontWeight: "700", color: colors.textSubtle },
  progress: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.xs },
  progressText: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  progressStrong: { color: colors.text },
  verdict: { ...typography.hint, fontWeight: "800" },
  receipt: { gap: 2, padding: spacing.sm + 4, borderWidth: 1, borderRadius: radius.md },
  receiptTitle: { ...typography.label },
  receiptText: { ...typography.hint },
  hint: { ...typography.hint, color: colors.textMuted },
  actions: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
