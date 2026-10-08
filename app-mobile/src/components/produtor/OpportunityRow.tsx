import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { formatBRL } from "@/lib/format/currency";
import type { Opportunity } from "@/lib/produtor/dashboard";
import { remainingQuantity } from "@/lib/produtor/demands";
import { colors, radius, spacing, typography } from "@/theme";

// Um pedido aberto que ainda tem muito a oferecer; tocar leva ao Mural, onde se faz a oferta.
export function OpportunityRow({ opportunity, onPress }: { opportunity: Opportunity; onPress: () => void }) {
  const { demand, value } = opportunity;
  const remaining = `${remainingQuantity(demand)} ${demand.unidade}`;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${demand.produto}: faltam ${remaining}. Abrir no Mural.`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={styles.product}>{demand.produto}</Text>
        <Text style={styles.detail}>
          Faltam {remaining}
          {value > 0 ? ` · até ${formatBRL(value)}` : ""}
        </Text>
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
});
