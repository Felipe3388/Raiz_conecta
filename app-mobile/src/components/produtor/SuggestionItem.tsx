import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { formatBRL } from "@/lib/format/currency";
import { formatDateBR } from "@/lib/format/date";
import { suggestionStatusInfo } from "@/lib/produtor/suggestionStatus";
import type { SuggestionRecord } from "@/types/produtor";
import { colors, radius, spacing, typography } from "@/theme";

// Uma sugestão de produto e em que pé ela está.
export function SuggestionItem({ suggestion }: { suggestion: SuggestionRecord }) {
  const status = suggestionStatusInfo(suggestion.status, suggestion.motivo);
  // Uma informação por linha: o preço ("R$ 8,50/kg") não quebra no meio.
  const meta = [
    `Enviada em ${formatDateBR(suggestion.criadoEm)}`,
    suggestion.precoSugerido != null ? `Preço sugerido: ${formatBRL(suggestion.precoSugerido)}/kg` : null,
  ].filter((line): line is string => line !== null);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={2}>
          {suggestion.nomeProduto}
        </Text>
        <Badge label={status.label} variant={status.variant} dot />
      </View>
      <Text style={styles.help}>{status.help}</Text>
      {suggestion.descricao !== "" && (
        <Text style={styles.description} numberOfLines={2}>
          {suggestion.descricao}
        </Text>
      )}
      <View>
        {meta.map((line) => (
          <Text key={line} style={styles.meta}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  name: { ...typography.label, flex: 1, color: colors.text },
  help: { ...typography.hint, fontWeight: "700", color: colors.textStrong },
  description: { ...typography.hint, color: colors.textMuted },
  meta: { ...typography.caption, color: colors.textSubtle },
});
