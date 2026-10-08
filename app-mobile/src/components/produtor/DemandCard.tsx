import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL } from "@/lib/format/currency";
import {
  canOffer,
  findOffer,
  fulfilledQuantity,
  progressPercent,
  remainingQuantity,
} from "@/lib/produtor/demands";
import { colors, radius, spacing, typography } from "@/theme";
import type { Demand } from "@/types/produtor";

interface DemandCardProps {
  demand: Demand;
  producerEmail: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onOffer: () => void;
  isSending: boolean;
}

// Pedido de um mercado: quanto precisa, quanto já foi prometido e onde você faz a sua oferta.
export function DemandCard({
  demand,
  producerEmail,
  quantity,
  onQuantityChange,
  onOffer,
  isSending,
}: DemandCardProps) {
  const myOffer = findOffer(demand, producerEmail);
  const remaining = remainingQuantity(demand);
  const isClosed = demand.status === "CONCLUIDA";

  return (
    <View style={[styles.card, myOffer && styles.cardMine]}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.overline}>Mercado precisa de</Text>
          <Text style={styles.product}>{demand.produto}</Text>
        </View>
        <Badge label={isClosed ? "Fechada" : "Aberta"} variant={isClosed ? "success" : "warning"} />
      </View>

      <View style={styles.figures}>
        <View>
          <Text style={styles.figureLabel}>Estimativa</Text>
          <Text style={styles.price}>
            {formatBRL(demand.precoMedio)} <Text style={styles.unit}>/ {demand.unidade}</Text>
          </Text>
        </View>
        <View style={styles.figureRight}>
          <Text style={styles.figureLabel}>Pedido</Text>
          <Text style={styles.ordered}>
            {demand.quantidade} <Text style={styles.unit}>{demand.unidade}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            Preenchido:{" "}
            <Text style={styles.progressDone}>
              {fulfilledQuantity(demand)} {demand.unidade}
            </Text>
          </Text>
          {!myOffer && (
            <Text style={styles.progressMissing}>
              Faltam: {remaining} {demand.unidade}
            </Text>
          )}
        </View>
        <ProgressBar value={progressPercent(demand)} />
      </View>

      <View style={styles.footer}>
        {myOffer ? (
          <View style={styles.confirmed}>
            <Ionicons name="checkmark-circle" size={28} color={colors.infoText} />
            <Text style={styles.confirmedText}>
              Você garantiu {myOffer.quantidade} {demand.unidade}!
            </Text>
          </View>
        ) : (
          <View style={styles.offerForm}>
            <Text style={styles.offerLabel}>Quanto você enviará?</Text>
            <QuantityInput
              label={`Quantidade de ${demand.produto}`}
              value={quantity}
              max={remaining}
              onChange={onQuantityChange}
            />
            <Button
              label="Ofertar"
              size="lg"
              isLoading={isSending}
              disabled={!canOffer(quantity, remaining)}
              onPress={onOffer}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md + 4,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderRadius: radius.lg + 4,
  },
  cardMine: { borderColor: colors.infoBorder, backgroundColor: colors.infoSoft },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  titleBlock: { flex: 1, gap: 2 },
  overline: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", color: colors.textSubtle },
  product: { fontSize: 26, fontWeight: "900", color: colors.text },
  figures: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.sm + 4,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  figureRight: { alignItems: "flex-end" },
  figureLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", color: colors.textMuted },
  price: { fontSize: 20, fontWeight: "900", color: colors.primaryPressed },
  ordered: { fontSize: 20, fontWeight: "900", color: colors.textStrong },
  unit: { fontSize: 14, fontWeight: "400", color: colors.textSubtle },
  progress: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  progressText: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  progressDone: { color: colors.primaryPressed },
  progressMissing: { ...typography.hint, fontWeight: "700", color: colors.warningStrong },
  footer: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  offerForm: { gap: spacing.sm + 2 },
  offerLabel: { ...typography.label, color: colors.textStrong },
  confirmed: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.md,
  },
  confirmedText: { ...typography.label, color: colors.infoDark, textAlign: "center" },
});
