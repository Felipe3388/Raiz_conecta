import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import type { NegotiationController } from "@/hooks/useNegotiation";
import { formatBRL } from "@/lib/format/currency";
import { colors, radius, spacing, typography } from "@/theme";
import { RoundsTrail } from "./RoundsTrail";

interface NegotiationPanelProps {
  negotiation: NegotiationController;
  // Unidade do pedido (ex.: "Caixas"), para dizer "por caixa".
  unidade: string;
  // O que o produtor pede (preço ofertado) e o que o pedido paga.
  producerPrice: number | null;
  marketPrice: number;
  // Quando a quantidade é conhecida, mostra o valor total do acordo.
  quantity?: number;
  // O que fazer depois do fim: confirmar a oferta, recomeçar... Cada tela decide.
  finish: ReactNode;
}

// Uma negociação por inteiro: a proposta da vez, os botões de aceitar ou recusar e, no fim, o resultado.
export function NegotiationPanel({
  negotiation,
  unidade,
  producerPrice,
  marketPrice,
  quantity,
  finish,
}: NegotiationPanelProps) {
  const { state, proposal, pause } = negotiation;
  const unit = unidade.toLowerCase();

  return (
    <View style={styles.panel}>
      <View style={styles.facts}>
        <Fact label="Você pede" value={producerPrice === null ? "—" : formatBRL(producerPrice)} />
        <Fact label="O pedido paga até" value={formatBRL(marketPrice)} />
      </View>

      <RoundsTrail negotiation={state} seenCount={negotiation.seen.length} />

      {pause !== null ? (
        <View style={styles.pauseBlock}>
          <Ionicons name="time-outline" size={32} color={colors.warningStrong} />
          <Text style={styles.pauseTitle} accessibilityRole="header">
            Você recusou {formatBRL(pause.refusedPrice)}
          </Text>
          <Text style={styles.pauseNote}>
            O mercado está avaliando e a próxima proposta chega em {pause.secondsLeft}{" "}
            {pause.secondsLeft === 1 ? "segundo" : "segundos"}. Dá tempo de pensar.
          </Text>
          <Button
            label={`Mudei de ideia: aceitar ${formatBRL(pause.refusedPrice)}`}
            variant="amberOutline"
            onPress={negotiation.takeBack}
          />
        </View>
      ) : proposal !== null ? (
        <View style={styles.offerBlock}>
          <Text style={styles.step} accessibilityLiveRegion="polite">
            Proposta {negotiation.step}
          </Text>
          <Text style={styles.overline}>O mercado oferece</Text>
          <Text style={styles.proposal} accessibilityRole="header">
            {formatBRL(proposal)} <Text style={styles.unit}>/ {unit}</Text>
          </Text>
          {negotiation.isLast && (
            <Text style={styles.last}>Esta é a última proposta: é o máximo que o pedido paga.</Text>
          )}
          <View style={styles.buttons}>
            <Button label={`Aceitar ${formatBRL(proposal)}`} size="lg" onPress={negotiation.accept} />
            <Button
              label={negotiation.isLast ? "Recusar" : "Recusar, quero mais"}
              variant="amberOutline"
              onPress={negotiation.reject}
            />
          </View>
        </View>
      ) : state.outcome === "deal" && state.dealPrice !== null ? (
        <View style={[styles.result, styles.resultDeal]}>
          <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
          <Text style={styles.resultTitle}>Acordo fechado!</Text>
          <Text style={styles.resultPrice}>
            {formatBRL(state.dealPrice)} <Text style={styles.unit}>/ {unit}</Text>
          </Text>
          <Text style={styles.resultNote}>
            {state.autoAccepted ? "As propostas chegaram ao preço que você pediu." : "Você aceitou esta proposta."}
            {quantity ? ` Total de ${formatBRL(state.dealPrice * quantity)} por ${quantity} ${unit}.` : ""}
          </Text>
          {finish}
        </View>
      ) : (
        <View style={[styles.result, styles.resultNone]}>
          <Ionicons name="close-circle" size={36} color={colors.danger} />
          <Text style={styles.resultTitle}>Sem acordo desta vez</Text>
          <Text style={styles.resultNote}>
            {producerPrice !== null && producerPrice > marketPrice
              ? `Você pede ${formatBRL(producerPrice)} e o pedido paga no máximo ${formatBRL(marketPrice)}. Se quiser fechar, ajuste o seu preço.`
              : "Nenhuma proposta serviu para você."}
          </Text>
          {finish}
        </View>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  facts: { flexDirection: "row", gap: spacing.sm },
  fact: {
    flex: 1,
    gap: 2,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  factLabel: { ...typography.caption, fontWeight: "800", textTransform: "uppercase", color: colors.textMuted },
  factValue: { fontSize: 18, fontWeight: "900", color: colors.textStrong },
  offerBlock: { gap: spacing.sm },
  pauseBlock: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningTint,
    borderWidth: 1.5,
    borderColor: colors.warningBorder,
  },
  pauseTitle: { ...typography.heading, color: colors.warningDarkest, textAlign: "center" },
  pauseNote: { ...typography.hint, color: colors.warningDark, textAlign: "center" },
  step: { ...typography.hint, fontWeight: "800", color: colors.warningText },
  overline: { ...typography.caption, fontWeight: "800", textTransform: "uppercase", color: colors.textMuted },
  proposal: { fontSize: 36, lineHeight: 42, fontWeight: "900", color: colors.warningDarkest },
  unit: { fontSize: 16, fontWeight: "400", color: colors.textSubtle },
  last: { ...typography.hint, fontWeight: "700", color: colors.warningText },
  buttons: { gap: spacing.sm, paddingTop: spacing.xs },
  result: { alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  resultDeal: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  resultNone: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  resultTitle: { ...typography.heading, color: colors.text },
  resultPrice: { fontSize: 32, fontWeight: "900", color: colors.primaryText },
  resultNote: { ...typography.hint, color: colors.textStrong, textAlign: "center" },
});
