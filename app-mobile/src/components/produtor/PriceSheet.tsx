import { StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePriceForm } from "@/hooks/usePriceForm";
import { formatBRL } from "@/lib/format/currency";
import type { SuggestedPrice } from "@/lib/pricing/suggestion";
import { colors, radius, spacing, typography } from "@/theme";

interface PriceSheetProps {
  visible: boolean;
  produto: string;
  // Unidade do produto (ex.: "Caixas"), para dizer "por caixa".
  unidade?: string;
  // O preço que o produtor pede hoje, ou null.
  currentPrice: number | null;
  // A média da plataforma: só uma referência, nunca vira o preço dele sozinha.
  suggested: SuggestedPrice | null;
  // `null` remove o preço.
  onSave: (price: number | null) => Promise<void>;
  onClose: () => void;
}

// Folha para o produtor sugerir o preço de um produto (o preço ofertado). Só a equipe usa: o preço dos pedidos é fixo.
export function PriceSheet({ visible, produto, unidade, currentPrice, suggested, onSave, onClose }: PriceSheetProps) {
  const form = usePriceForm(visible, currentPrice, onSave);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      icon="pricetag-outline"
      title={`Preço de ${produto}`}
      subtitle={unidade ? `Quanto você pede por unidade (${unidade.toLowerCase()})` : "Quanto você pede por unidade"}
      footer={
        <View style={styles.footer}>
          <Button label="Salvar preço" variant="amber" isLoading={form.isSaving} onPress={form.submit} />
          {currentPrice !== null && (
            <Button label="Remover preço" variant="ghost" disabled={form.isSaving} onPress={form.remove} />
          )}
        </View>
      }
    >
      <View style={styles.body}>
        <Input
          label="Seu preço (R$)"
          icon="cash-outline"
          value={form.text}
          onChangeText={form.change}
          placeholder="Ex.: 3,50"
          keyboardType="decimal-pad"
          error={form.error ?? undefined}
          onSubmitEditing={form.submit}
        />

        <View style={styles.reference}>
          {suggested ? (
            <View style={styles.referenceRow}>
              <View style={styles.referenceText}>
                <Text style={styles.referenceLabel}>Média sugerida pela plataforma</Text>
                <Text style={styles.referenceValue}>{formatBRL(suggested.price)}</Text>
              </View>
              <Button label="Usar" variant="amberOutline" size="sm" onPress={() => form.fill(suggested.price)} />
            </View>
          ) : (
            <Text style={styles.referenceNote}>Ainda não temos uma média para este produto.</Text>
          )}
          <Text style={styles.referenceNote}>
            É só uma sugestão: ela ajuda a nossa equipe a montar os preços dos pedidos. O preço dos pedidos em Ofertas é
            fixo e não muda por causa dele.
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, padding: spacing.md },
  footer: { gap: spacing.xs },
  reference: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  referenceText: { gap: 2 },
  referenceLabel: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  referenceValue: { fontSize: 20, fontWeight: "700", color: colors.warningDarkest },
  referenceNote: { ...typography.hint, color: colors.textMuted },
});
