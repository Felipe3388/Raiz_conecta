import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { formatBRL } from "@/lib/format/currency";
import { itemsSummary, minutesLabel, proposalTotal, secondsLeft } from "@/lib/produtor/proposals";
import { colors, radius, spacing, typography } from "@/theme";
import type { Proposal } from "@/types/proposal";

interface ProposalRowProps {
  proposal: Proposal;
  now: Date;
  onPress: () => void;
}

// Um pedido que espera resposta, em uma linha; tocar leva a Ofertas, onde se aceita ou recusa.
export function ProposalRow({ proposal, now, onPress }: ProposalRowProps) {
  const remaining = minutesLabel(secondsLeft(proposal, now));
  const products = itemsSummary(proposal);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${proposal.mercado}, pedido nº ${proposal.numero}: ${products}. Responda em ${remaining}. Abrir em Ofertas.`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={styles.product}>{proposal.mercado}</Text>
        <Text style={styles.detail}>
          {products} · {formatBRL(proposalTotal(proposal))}
        </Text>
        <Text style={styles.time}>Responda em {remaining}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  text: { flex: 1, gap: 2 },
  product: { ...typography.label, color: colors.text },
  detail: { ...typography.hint, color: colors.warningText },
  time: { ...typography.hint, fontWeight: "800", color: colors.warningDark },
});
