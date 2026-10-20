import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STAGE_INFO } from "@/content/deliveryTexts";
import type { OrderCard } from "@/lib/delivery/orderCard";
import { formatBRL } from "@/lib/format/currency";
import { formatKg } from "@/lib/format/weight";
import { colors, radius, spacing, typography } from "@/theme";
import { OrderItemRow } from "./OrderItemRow";
import { StageBadge } from "./StageBadge";
import { TONE_COLORS } from "./tones";

interface OrderCardViewProps {
  card: OrderCard;
  onWeigh: () => void;
  onHandOver: () => void;
  // Só no modo simulado: faz de conta que o mercado pesou ao receber.
  onSimulateReceipt?: () => void;
}

function weighLabel(card: OrderCard): string {
  if (card.weighedItems === 0) return "Pesar pedido";
  return card.weighedItems < card.itemCount ? "Continuar pesagem" : "Revisar pesagem";
}

// Um pedido a entregar: o mercado, a lista dos produtos dele, quanto já foi pesado e o que fazer agora.
export function OrderCardView({ card, onWeigh, onHandOver, onSimulateReceipt }: OrderCardViewProps) {
  const { stage, actions } = card;
  const info = STAGE_INFO[stage];
  const tone = TONE_COLORS[info.tone];
  const canWeigh = actions.includes("WEIGH");
  const canHandOver = actions.includes("HAND_OVER");
  const waitingMarket = actions.includes("RECEIVE");
  const isDone = stage === "RECEBIDA" || stage === "DIVERGENTE";
  const allInRange = card.outOfRange.length === 0;

  return (
    <View style={[styles.card, { borderColor: tone.border }]} accessibilityLabel={`Pedido de ${card.mercado}`}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="storefront-outline" size={26} color={colors.primaryPressed} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.market}>{card.mercado}</Text>
          <Text style={styles.detail}>
            {card.itemCount === 1 ? "1 produto" : `${card.itemCount} produtos`} · {formatKg(card.expectedKg)}
          </Text>
        </View>
        <StageBadge stage={stage} />
      </View>

      <View style={styles.when}>
        <Text style={[styles.day, card.late && styles.late]}>
          {card.late ? `Atrasado · era para ${card.dayLabel.toLowerCase()}` : `Entrega: ${card.dayLabel.toLowerCase()}`}
        </Text>
        <Text style={styles.value}>
          {formatBRL(card.value)} <Text style={styles.valueNote}>{card.valueConfirmed ? "conferido" : "estimado"}</Text>
        </Text>
      </View>

      <View style={styles.items}>
        {card.items.map((item) => (
          <OrderItemRow key={item.delivery.id} card={item} />
        ))}
      </View>

      {!isDone && (
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Pesado: <Text style={styles.progressStrong}>{formatKg(card.weighedKg)}</Text> de{" "}
              {formatKg(card.expectedKg)}
            </Text>
            <Text style={styles.progressText}>
              {card.weighedItems} de {card.itemCount} produtos
            </Text>
          </View>
          <ProgressBar value={card.percent} color={allInRange ? colors.primary : colors.warning} />
        </View>
      )}

      <Text style={styles.hint}>{info.hint}</Text>

      {(canWeigh || canHandOver || waitingMarket) && (
        <View style={styles.actions}>
          {canWeigh && (
            <Button
              label={weighLabel(card)}
              variant={canHandOver && allInRange ? "outline" : "primary"}
              onPress={onWeigh}
            />
          )}
          {canHandOver && (
            <Button
              label="Entregar pedido à logística"
              variant={allInRange ? "primary" : "amberOutline"}
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
  icon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  titleBlock: { flex: 1, gap: 2 },
  market: { fontSize: 20, fontWeight: "900", color: colors.text },
  detail: { ...typography.hint, color: colors.textMuted },
  when: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  day: { ...typography.hint, fontWeight: "800", color: colors.textStrong, flexShrink: 1 },
  late: { color: colors.danger },
  value: { fontSize: 17, fontWeight: "900", color: colors.primaryPressed },
  valueNote: { fontSize: 12, fontWeight: "700", color: colors.textSubtle },
  items: { gap: spacing.xs + 2 },
  progress: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.xs },
  progressText: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  progressStrong: { color: colors.text },
  hint: { ...typography.hint, color: colors.textMuted },
  actions: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
