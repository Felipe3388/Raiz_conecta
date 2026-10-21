import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import { StepTransition } from "@/components/motion/StepTransition";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  RUN_TEXTS,
  runProgressLabel,
  SCALE_TEXTS,
  VERDICT_TONES,
  verdictSummary,
  type StageTone,
} from "@/content/deliveryTexts";
import type { useWeighRun } from "@/hooks/useWeighRun";
import type { ScaleStatusKey } from "@/lib/delivery/scale";
import { formatKg } from "@/lib/format/weight";
import type { ScaleSimulator } from "@/services";
import { colors, radius, spacing, typography } from "@/theme";
import { OrderItemRow } from "./OrderItemRow";
import { ScaleSimulatorPanel } from "./ScaleSimulatorPanel";
import { TONE_COLORS } from "./tones";

type WeighRun = ReturnType<typeof useWeighRun>;

const STATUS_TONES: Record<ScaleStatusKey, StageTone> = {
  connecting: "neutral",
  lost: "danger",
  empty: "neutral",
  settling: "warning",
  stable: "success",
  locked: "info",
};

// Na balança simulada, "colocar o próximo produto" com o anterior ainda lá espera a balança esvaziar, como na de
// verdade (a balança só libera o próximo peso depois de esvaziar).
const RELEASE_MS = 1500;

// A pesagem em tela cheia, um produto por vez: o mercado no topo, o que pesar em letra grande e a leitura da balança.
// No modo automático não há botão para tocar: o celular fala o que pesar e o app segue sozinho quando o peso estabiliza.
export function WeighRunScreen({ run }: { run: WeighRun }) {
  const { sheet, order, card, position } = run;
  const simulator = sheet.scale.simulator;
  const locked = sheet.scale.status === "locked";

  const panelSimulator = useMemo<ScaleSimulator | undefined>(() => {
    if (!simulator) return undefined;
    return {
      clear: () => simulator.clear(),
      place: (kg) => {
        if (!locked) return simulator.place(kg);
        simulator.clear();
        setTimeout(() => simulator.place(kg), RELEASE_MS);
      },
    };
  }, [simulator, locked]);

  if (!position) return null;

  const confirming = run.phase === "confirm";
  const between = run.between;
  const range = sheet.judgement.range;
  const tone = TONE_COLORS[VERDICT_TONES[sheet.judgement.verdict]];
  const statusTone = TONE_COLORS[STATUS_TONES[sheet.scale.status]];
  const progress = ((position.step - 1) / position.steps) * 100;
  const inRange = card?.weighing.verdict === "NA_FAIXA";

  const nextLabel = position.isLastOfOrder && !run.isAuto ? RUN_TEXTS.finishOrder : RUN_TEXTS.next;
  const registerLabel = sheet.candidate !== null ? `Registrar ${formatKg(sheet.candidate)}` : RUN_TEXTS.register;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={run.close}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={RUN_TEXTS.close}
            onPress={run.close}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </PressableScale>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {RUN_TEXTS.title} · {run.isAuto ? RUN_TEXTS.autoNote : RUN_TEXTS.manualNote}
            </Text>
            <Text style={styles.headerHint}>
              {between ? RUN_TEXTS.betweenDone(position.order, position.orders) : runProgressLabel(position)}
            </Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={run.muted ? RUN_TEXTS.unmute : RUN_TEXTS.mute}
            onPress={run.toggleMuted}
            style={styles.iconButton}
          >
            <Ionicons name={run.muted ? "volume-mute-outline" : "volume-high-outline"} size={26} color={colors.text} />
          </PressableScale>
        </View>
        <View style={styles.progress}>
          <ProgressBar value={progress} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <StepTransition stepKey={`${run.phase}-${position.step}`}>
            <View style={styles.stepContent}>
              {between ? (
                <View style={styles.between}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                  <Text accessibilityRole="header" style={styles.betweenTitle}>
                    {RUN_TEXTS.betweenTitle(between.finishedMercado)}
                  </Text>
                  <View style={styles.betweenNext}>
                    <Text style={styles.betweenLabel}>{RUN_TEXTS.betweenNext}</Text>
                    <Text style={styles.betweenMarket}>{between.nextMercado}</Text>
                    <Text style={styles.hint}>{RUN_TEXTS.betweenProducts(between.nextItems)}</Text>
                  </View>
                  <Text
                    accessibilityLiveRegion="polite"
                    accessibilityLabel={RUN_TEXTS.betweenCountdown(between.seconds)}
                    style={styles.countdown}
                  >
                    {between.seconds}
                  </Text>
                  <Text style={styles.hint}>{RUN_TEXTS.betweenHint}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.market}>
                    <Ionicons name="storefront-outline" size={22} color={colors.primaryPressed} />
                    <Text style={styles.marketName} numberOfLines={2}>
                      {order?.mercado}
                    </Text>
                  </View>

                  {confirming && order ? (
                    <View style={styles.confirm}>
                      <Text style={styles.confirmTitle}>{RUN_TEXTS.confirmTitle}</Text>
                      <Text style={styles.hint}>{RUN_TEXTS.confirmHint}</Text>
                      {order.items.map((item) => (
                        <OrderItemRow key={item.delivery.id} card={item} />
                      ))}
                    </View>
                  ) : (
                    card && (
                      <>
                        <View style={styles.product}>
                          <Text style={styles.productName}>{card.delivery.produto}</Text>
                          <Text style={styles.toWeigh}>{RUN_TEXTS.weigh(formatKg(sheet.expectedKg))}</Text>
                          <Text style={styles.hint}>
                            {RUN_TEXTS.range(formatKg(range.minKg), formatKg(range.maxKg))}
                          </Text>
                        </View>

                        {sheet.source === "BALANCA" ? (
                          <View style={[styles.scale, { backgroundColor: tone.soft, borderColor: tone.border }]}>
                            <Text
                              style={styles.reading}
                              accessibilityLabel={`Leitura da balança: ${formatKg(sheet.scale.kg)}`}
                              accessibilityLiveRegion="polite"
                            >
                              {formatKg(sheet.scale.kg)}
                            </Text>
                            <View style={styles.status}>
                              <Ionicons
                                name={sheet.scale.status === "stable" ? "checkmark-circle" : "radio-outline"}
                                size={20}
                                color={statusTone.strong}
                              />
                              <Text style={[styles.statusText, { color: statusTone.text }]}>
                                {sheet.scale.status === "locked" ? RUN_TEXTS.locked : SCALE_TEXTS[sheet.scale.status]}
                              </Text>
                            </View>
                            <Text style={[styles.verdict, { color: tone.text }]}>
                              {verdictSummary(sheet.judgement)}
                            </Text>
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

                        {sheet.error && (
                          <Text accessibilityRole="alert" style={styles.error}>
                            {sheet.error}
                          </Text>
                        )}

                        <PressableScale
                          accessibilityRole="button"
                          accessibilityLabel={sheet.source === "BALANCA" ? RUN_TEXTS.typeWeight : RUN_TEXTS.useScale}
                          onPress={() => sheet.changeSource(sheet.source === "BALANCA" ? "DIGITADO" : "BALANCA")}
                          style={styles.switchSource}
                        >
                          <Text style={styles.switchSourceText}>
                            {sheet.source === "BALANCA" ? RUN_TEXTS.typeWeight : RUN_TEXTS.useScale}
                          </Text>
                        </PressableScale>

                        {sheet.source === "BALANCA" && panelSimulator && (
                          <ScaleSimulatorPanel simulator={panelSimulator} suggestKg={sheet.expectedKg} />
                        )}
                      </>
                    )
                  )}
                </>
              )}
            </View>
          </StepTransition>
        </ScrollView>

        <View style={styles.footer}>
          {between ? (
            <>
              <Button label={RUN_TEXTS.startNow} onPress={run.next} />
              <Button label={RUN_TEXTS.later} variant="ghost" onPress={run.skipNext} />
            </>
          ) : confirming ? (
            <>
              <Button label={position.isLast ? RUN_TEXTS.confirmLast : RUN_TEXTS.confirm} onPress={run.confirmOrder} />
              <Button label={RUN_TEXTS.review} variant="ghost" onPress={run.previous} />
            </>
          ) : (
            <>
              {(!run.isAuto || sheet.candidate !== null) && (
                <Button
                  label={registerLabel}
                  isLoading={sheet.isSaving}
                  disabled={sheet.candidate === null}
                  onPress={sheet.register}
                />
              )}
              <View style={styles.steps}>
                {position.step > 1 && (
                  <View style={styles.step}>
                    <Button label={RUN_TEXTS.previous} variant="ghost" onPress={run.previous} />
                  </View>
                )}
                <View style={styles.step}>
                  <Button label={nextLabel} variant={inRange ? "primary" : "ghost"} onPress={run.next} />
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { ...typography.label, color: colors.text },
  headerHint: { ...typography.hint, color: colors.textMuted },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  progress: { paddingHorizontal: spacing.md },
  stepContent: { gap: spacing.md },
  between: { alignItems: "center", gap: spacing.md, paddingTop: spacing.lg },
  betweenTitle: { ...typography.heading, fontSize: 24, color: colors.text, textAlign: "center" },
  betweenNext: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 4,
    padding: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
  },
  betweenLabel: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
  betweenMarket: { fontSize: 26, lineHeight: 32, fontWeight: "700", color: colors.text, textAlign: "center" },
  countdown: { fontSize: 72, lineHeight: 80, fontWeight: "700", ...typography.numeric, color: colors.primaryPressed },
  body: { gap: spacing.md, padding: spacing.md, width: "100%", maxWidth: 560, alignSelf: "center" },
  market: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
  },
  marketName: { flex: 1, fontSize: 22, fontWeight: "700", color: colors.primaryPressed },
  product: { gap: 4, alignItems: "center" },
  productName: { fontSize: 38, lineHeight: 44, fontWeight: "700", color: colors.text, textAlign: "center" },
  toWeigh: { fontSize: 24, fontWeight: "700", color: colors.textStrong },
  hint: { ...typography.hint, color: colors.textMuted, textAlign: "center" },
  scale: { alignItems: "center", gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg },
  reading: { fontSize: 56, lineHeight: 64, fontWeight: "700", ...typography.numeric, color: colors.text },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { ...typography.hint, fontWeight: "700", flexShrink: 1 },
  verdict: { ...typography.label },
  error: { ...typography.hint, fontWeight: "700", color: colors.danger },
  switchSource: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  switchSourceText: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
  confirm: { gap: spacing.sm },
  confirmTitle: { ...typography.heading, fontSize: 20, color: colors.text },
  footer: {
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  steps: { flexDirection: "row", gap: spacing.sm },
  step: { flex: 1 },
});
