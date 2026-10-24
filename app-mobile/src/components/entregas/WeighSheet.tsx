import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { AlertModal } from "@/components/ui/AlertModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { Input } from "@/components/ui/Input";
import {
  producerVerdictSummary,
  SCALE_TEXTS,
  VERDICT_TONES,
  verdictSummary,
  type StageTone,
} from "@/content/deliveryTexts";
import { useWeighSheet } from "@/hooks/useWeighSheet";
import type { DeliveryCard } from "@/lib/delivery/card";
import type { OrderCard } from "@/lib/delivery/orderCard";
import type { ScaleStatusKey } from "@/lib/delivery/scale";
import { formatKg, formatPercent } from "@/lib/format/weight";
import { colors, radius, spacing, typography } from "@/theme";
import type { WeigherRole, WeighingInput, WeighingSource } from "@/types/delivery";
import { OrderItemRow } from "./OrderItemRow";
import { ScaleSimulatorPanel } from "./ScaleSimulatorPanel";
import { TONE_COLORS } from "./tones";
import { WeightGauge } from "./WeightGauge";

const SOURCE_OPTIONS: { value: WeighingSource; label: string }[] = [
  { value: "BALANCA", label: "Usar balança" },
  { value: "DIGITADO", label: "Digitar peso" },
];

const STATUS_TONES: Record<ScaleStatusKey, StageTone> = {
  connecting: "neutral",
  lost: "danger",
  empty: "neutral",
  settling: "warning",
  stable: "success",
  locked: "info",
};

interface WeighSheetProps {
  visible: boolean;
  // O pedido que está sendo pesado e o produto da vez.
  order: OrderCard | null;
  card: DeliveryCard | null;
  // A posição do produto da vez no pedido (a partir de 0) e se ele é o último.
  position: number;
  isLast: boolean;
  role: WeigherRole;
  onRegister: (input: WeighingInput) => Promise<void>;
  onRemove: (weighingId: string) => void;
  onSelect: (deliveryId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

// Folha de pesagem de um pedido, produto por produto. O produtor pesa cada um em lotes (balança ou digitando) até chegar
// ao peso pedido e passa ao próximo; o mercado pesa cada produto inteiro ao receber.
export function WeighSheet({
  visible,
  order,
  card,
  position,
  isLast,
  role,
  onRegister,
  onRemove,
  onSelect,
  onPrevious,
  onNext,
  onClose,
}: WeighSheetProps) {
  const sheet = useWeighSheet({ visible, delivery: card?.delivery ?? null, role, onRegister });
  const isProducer = role === "PRODUTOR";
  const delivery = card?.delivery;
  const range = sheet.judgement.range;
  const tone = TONE_COLORS[VERDICT_TONES[sheet.judgement.verdict]];
  const registered = isProducer ? (card?.weighedKg ?? 0) : 0;
  const missing = Math.max(0, sheet.expectedKg - sheet.projectedKg);

  const registerLabel = sheet.candidate !== null ? `Registrar ${formatKg(sheet.candidate)}` : "Registrar peso";
  const total = order?.itemCount ?? 1;
  const inRange = card?.weighing.verdict === "NA_FAIXA";

  return (
    <BottomSheet
      visible={visible && card !== null}
      onClose={onClose}
      icon="scale-outline"
      title={isProducer ? `Pesar ${delivery?.produto ?? ""}` : `Pesagem do mercado: ${delivery?.produto ?? ""}`}
      subtitle={card ? `${order?.mercado ?? ""} · produto ${position + 1} de ${total}` : undefined}
      footer={
        <View style={styles.footer}>
          <Button
            label={registerLabel}
            isLoading={sheet.isSaving}
            disabled={sheet.candidate === null}
            onPress={sheet.register}
          />
          {isProducer ? (
            <View style={styles.steps}>
              {position > 0 && (
                <View style={styles.step}>
                  <Button label="Anterior" variant="ghost" onPress={onPrevious} />
                </View>
              )}
              <View style={styles.step}>
                <Button
                  label={isLast ? "Concluir pesagem" : "Próximo produto"}
                  variant={inRange ? "outline" : "ghost"}
                  onPress={() => sheet.canLeave() && onNext()}
                />
              </View>
            </View>
          ) : (
            <Button label="Fechar" variant="ghost" onPress={onClose} />
          )}
        </View>
      }
    >
      {card && delivery && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.body}
        >
          {order && order.itemCount > 1 && (
            <View style={styles.order}>
              <Text style={styles.orderTitle}>Produtos do pedido</Text>
              {order.items.map((item) => (
                <PressableScale
                  key={item.delivery.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir para ${item.delivery.produto}`}
                  disabled={item.delivery.id === delivery.id}
                  onPress={() => onSelect(item.delivery.id)}
                >
                  <OrderItemRow card={item} current={item.delivery.id === delivery.id} />
                </PressableScale>
              ))}
            </View>
          )}

          <FilterChips value={sheet.source} onChange={sheet.changeSource} options={SOURCE_OPTIONS} />

          {sheet.source === "BALANCA" ? (
            <View style={styles.scale}>
              <Text style={styles.readingLabel}>Leitura da balança</Text>
              <Text style={styles.reading} accessibilityLabel={`Leitura da balança: ${formatKg(sheet.scale.kg)}`}>
                {formatKg(sheet.scale.kg)}
              </Text>
              <View style={styles.status}>
                <Ionicons
                  name={sheet.scale.status === "stable" ? "checkmark-circle" : "radio-outline"}
                  size={18}
                  color={TONE_COLORS[STATUS_TONES[sheet.scale.status]].strong}
                />
                <Text style={[styles.statusText, { color: TONE_COLORS[STATUS_TONES[sheet.scale.status]].text }]}>
                  {SCALE_TEXTS[sheet.scale.status]}
                </Text>
              </View>
            </View>
          ) : (
            <Input
              label="Peso do lote (kg)"
              icon="create-outline"
              value={sheet.text}
              onChangeText={sheet.changeText}
              placeholder="Ex.: 9,88"
              keyboardType="decimal-pad"
              onSubmitEditing={sheet.register}
            />
          )}

          {sheet.source === "BALANCA" && sheet.scale.simulator && (
            <ScaleSimulatorPanel
              simulator={sheet.scale.simulator}
              suggestKg={Math.max(0, sheet.expectedKg - registered)}
            />
          )}

          <View style={[styles.summary, { backgroundColor: tone.soft, borderColor: tone.border }]}>
            <Text style={styles.expected}>
              Esperado {formatKg(sheet.expectedKg)} ·{" "}
              {isProducer
                ? `mínimo ${formatKg(range.minKg)}`
                : `aceita de ${formatKg(range.minKg)} a ${formatKg(range.maxKg)}`}
            </Text>
            <WeightGauge
              range={range}
              expectedKg={sheet.expectedKg}
              registeredKg={registered}
              pendingKg={sheet.candidate ?? 0}
              tone={VERDICT_TONES[sheet.judgement.verdict]}
              openEnded={isProducer}
            />
            {isProducer && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Já registrado</Text>
                <Text style={styles.sumValue}>{formatKg(registered)}</Text>
              </View>
            )}
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Este lote</Text>
              <Text style={styles.sumValue}>{sheet.candidate !== null ? formatKg(sheet.candidate) : "—"}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, styles.sumStrong]}>{isProducer ? "Total" : "Peso"}</Text>
              <Text style={[styles.sumValue, styles.sumStrong]}>
                {formatKg(sheet.projectedKg)}
                {sheet.projectedKg > 0 && ` (${formatPercent(sheet.judgement.diffPercent)})`}
              </Text>
            </View>
            <Text style={[styles.verdict, { color: tone.text }]} accessibilityLiveRegion="polite">
              {isProducer ? producerVerdictSummary(sheet.judgement) : verdictSummary(sheet.judgement)}
              {isProducer && sheet.judgement.verdict === "ABAIXO" && missing > 0
                ? ` · faltam ${formatKg(missing)} para o ideal`
                : ""}
            </Text>
          </View>

          {sheet.error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {sheet.error}
            </Text>
          )}

          {isProducer && delivery.weighings.length > 0 && (
            <View style={styles.history}>
              <Text style={styles.historyTitle}>Lotes registrados</Text>
              {delivery.weighings.map((item, index) => (
                <View key={item.id} style={styles.historyRow}>
                  <Text style={styles.historyText}>
                    Lote {index + 1} · {formatKg(item.kg)} · {item.source === "BALANCA" ? "balança" : "digitado"}
                  </Text>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Remover lote ${index + 1}`}
                    onPress={() => onRemove(item.id)}
                    style={styles.remove}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </PressableScale>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      {sheet.alert && (
        <AlertModal
          visible
          title={sheet.alert.title}
          message={sheet.alert.message}
          button={sheet.alert.button}
          onClose={sheet.dismissAlert}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, padding: spacing.md },
  footer: { gap: spacing.xs },
  steps: { flexDirection: "row", gap: spacing.sm },
  step: { flex: 1 },
  order: { gap: spacing.xs + 2 },
  orderTitle: { ...typography.label, color: colors.textStrong },
  scale: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingLabel: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  reading: { fontSize: 44, lineHeight: 52, fontWeight: "700", color: colors.text },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { ...typography.hint, fontWeight: "700", flexShrink: 1 },
  summary: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderRadius: radius.md },
  expected: { ...typography.hint, fontWeight: "700", color: colors.textStrong },
  sumRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  sumLabel: { ...typography.body, color: colors.textMuted },
  sumValue: { ...typography.body, fontWeight: "700", color: colors.text },
  sumStrong: { fontWeight: "700", color: colors.text },
  verdict: { ...typography.label },
  error: { ...typography.hint, fontWeight: "700", color: colors.danger },
  history: { gap: spacing.xs },
  historyTitle: { ...typography.label, color: colors.textStrong },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  historyText: { ...typography.hint, flex: 1, color: colors.textStrong },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
