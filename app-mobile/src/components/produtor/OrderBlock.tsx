import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ORDER_ACTIONS,
  PARTIAL_NOTE,
  PRICE_NOTE,
  PROPOSAL_CLOSED_NOTES,
  PROPOSAL_STATUS_INFO,
  URGENT_SECONDS,
} from "@/content/proposalTexts";
import { deliveryDayLabel } from "@/lib/delivery/schedule";
import { formatBRL } from "@/lib/format/currency";
import {
  acceptedTotal,
  countdownLabel,
  effectiveStatus,
  isPartial,
  secondsLeft,
  selectedCount,
  selectionTotal,
} from "@/lib/produtor/proposals";
import { elevation, colors, radius, spacing, typography } from "@/theme";
import type { Proposal, ProposalQuantities } from "@/types/proposal";
import { OrderItemRow } from "./OrderItemRow";

interface OrderBlockProps {
  proposal: Proposal;
  // A hora de agora: é ela que faz a contagem regressiva andar.
  now: Date;
  quantities: ProposalQuantities;
  onChangeQuantity: (itemId: string, value: number) => void;
  onAcceptAll: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onRefuse: () => void;
}

// Um pedido de mercado: os produtos pedidos, o preço fixo de cada um e, enquanto há tempo, o campo para escolher
// quanto o produtor aceita de cada produto. Aceitar só uma parte é permitido: o resto segue para outros produtores.
export function OrderBlock({
  proposal,
  now,
  quantities,
  onChangeQuantity,
  onAcceptAll,
  onClear,
  onConfirm,
  onRefuse,
}: OrderBlockProps) {
  const status = effectiveStatus(proposal, now);
  const info = PROPOSAL_STATUS_INFO[status];
  const pending = status === "PENDENTE";
  const remaining = secondsLeft(proposal, now);
  const urgent = pending && remaining <= URGENT_SECONDS;
  const chosenCount = selectedCount(proposal, quantities);
  const total = selectionTotal(proposal, quantities);

  return (
    <View
      accessibilityLabel={`Pedido ${proposal.numero} de ${proposal.mercado}`}
      style={[styles.block, status === "ACEITA" && styles.blockAccepted]}
    >
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Pedido nº {proposal.numero}</Text>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>Entrega {deliveryDayLabel(proposal.entrega, now).toLowerCase()}</Text>
          </View>
        </View>
        <Badge label={info.label} variant={info.tone} dot />
      </View>

      {pending && (
        <View
          style={[styles.countdown, urgent && styles.countdownUrgent]}
          accessibilityRole="timer"
          accessibilityLabel={`Tempo para responder: ${countdownLabel(remaining)}`}
        >
          <Ionicons name="time-outline" size={20} color={urgent ? colors.danger : colors.warningStrong} />
          <Text style={[styles.countdownText, urgent && styles.countdownTextUrgent]}>
            Responda em {countdownLabel(remaining)}
          </Text>
        </View>
      )}

      <View style={styles.items}>
        {proposal.itens.map((item) => (
          <OrderItemRow
            key={item.id}
            item={item}
            chosen={quantities[item.id] ?? 0}
            editable={pending}
            onChange={(value) => onChangeQuantity(item.id, value)}
          />
        ))}
      </View>

      {pending && (
        <View style={styles.footer}>
          <Text style={styles.note}>{PRICE_NOTE}</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {chosenCount === 0
                ? "Nenhum produto escolhido"
                : `${chosenCount} de ${proposal.itens.length} ${proposal.itens.length === 1 ? "produto" : "produtos"}`}
            </Text>
            <Text style={styles.total}>{formatBRL(total)}</Text>
          </View>
          {chosenCount > 0 && isPartial(proposal, quantities) && <Text style={styles.note}>{PARTIAL_NOTE}</Text>}
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label={ORDER_ACTIONS.acceptAll} variant="outline" size="sm" onPress={onAcceptAll} />
            </View>
            <View style={styles.action}>
              <Button label={ORDER_ACTIONS.clear} variant="ghost" size="sm" onPress={onClear} />
            </View>
          </View>
          <Button label={ORDER_ACTIONS.confirm} disabled={chosenCount === 0} onPress={onConfirm} />
          <Button label={ORDER_ACTIONS.refuse} variant="ghost" onPress={onRefuse} />
        </View>
      )}

      {status === "ACEITA" && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Você recebe</Text>
            <Text style={styles.total}>{formatBRL(acceptedTotal(proposal))}</Text>
          </View>
          <View style={styles.planned}>
            <Ionicons name="cube-outline" size={16} color={colors.primaryText} />
            <Text style={styles.noteAccepted}>Já está em Entregas</Text>
          </View>
        </View>
      )}

      {PROPOSAL_CLOSED_NOTES[status] !== undefined && (
        <View style={styles.footer}>
          <Text style={styles.note}>{PROPOSAL_CLOSED_NOTES[status]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    borderRadius: radius.lg,
  },
  blockAccepted: { backgroundColor: colors.primarySoft },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  titleBlock: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { ...typography.hint, fontWeight: "700", color: colors.textStrong, flexShrink: 1 },
  items: { gap: spacing.sm },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
  countdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  countdownUrgent: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  countdownText: { ...typography.label, color: colors.warningDark },
  countdownTextUrgent: { color: colors.dangerText },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  totalLabel: { ...typography.label, color: colors.textStrong, flexShrink: 1 },
  total: { fontSize: 20, fontWeight: "700", color: colors.primaryPressed },
  note: { ...typography.hint, color: colors.textMuted },
  planned: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 2 },
  noteAccepted: { ...typography.hint, fontWeight: "700", color: colors.primaryText },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
