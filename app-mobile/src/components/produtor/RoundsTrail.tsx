import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { formatBRL } from "@/lib/format/currency";
import { roundStatus, type Negotiation, type RoundStatus } from "@/lib/pricing/negotiation";
import { colors, radius, spacing } from "@/theme";

const STATUS_LABELS: Record<RoundStatus, string> = {
  rejected: "recusada",
  accepted: "aceita",
  current: "proposta atual",
  pending: "próxima",
  unused: "não usada",
};

interface RoundsTrailProps {
  negotiation: Negotiation;
  // Quantas propostas já chegaram. As outras ficam escondidas: o produtor responde a uma de cada vez.
  seenCount: number;
}

// As propostas que já chegaram, em ordem: o produtor vê por onde o preço já passou.
export function RoundsTrail({ negotiation, seenCount }: RoundsTrailProps) {
  return (
    <View style={styles.trail} accessibilityRole="list">
      {negotiation.rounds.slice(0, seenCount).map((price, index) => {
        const status = roundStatus(negotiation, index);
        return (
          <View
            key={price}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${formatBRL(price)}, ${STATUS_LABELS[status]}`}
            style={[styles.pill, PILL_STYLES[status]]}
          >
            <Text style={[styles.text, TEXT_STYLES[status]]}>{formatBRL(price)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trail: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: { paddingVertical: 6, paddingHorizontal: spacing.sm + 4, borderRadius: radius.full, borderWidth: 1.5 },
  text: { fontSize: 14, fontWeight: "800" },
});

const PILL_STYLES: Record<RoundStatus, ViewStyle> = {
  rejected: { backgroundColor: colors.surfaceMuted, borderColor: colors.borderMid },
  accepted: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  current: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  pending: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderStyle: "dashed" },
  unused: { backgroundColor: colors.surface, borderColor: colors.border },
};

const TEXT_STYLES: Record<RoundStatus, TextStyle> = {
  rejected: { color: colors.textSubtle, textDecorationLine: "line-through" },
  accepted: { color: colors.primaryText },
  current: { color: colors.warningDarkest },
  pending: { color: colors.textMuted },
  unused: { color: colors.textSubtle },
};
