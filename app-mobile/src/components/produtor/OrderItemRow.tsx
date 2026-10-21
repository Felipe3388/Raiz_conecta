import { StyleSheet, Text, View } from "react-native";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL } from "@/lib/format/currency";
import { productEmoji } from "@/lib/produtor/productVisual";
import { colors, radius, spacing, typography } from "@/theme";
import type { ProposalItem } from "@/types/proposal";

interface OrderItemRowProps {
  item: ProposalItem;
  // Quantidade que a pessoa está escolhendo (só quando o pedido espera resposta).
  chosen: number;
  editable: boolean;
  onChange: (value: number) => void;
}

// Um produto do pedido: quanto o mercado pediu, o preço fixo e, se ainda dá para responder, o campo de quantidade.
// Depois da resposta, mostra quanto o produtor aceitou.
export function OrderItemRow({ item, chosen, editable, onChange }: OrderItemRowProps) {
  const unit = item.unidade.toLowerCase();
  const shown = editable ? chosen : (item.aceita ?? 0);

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <View style={styles.emoji}>
          <Text maxFontSizeMultiplier={1} style={styles.emojiText}>
            {productEmoji(item.produto)}
          </Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.product}>{item.produto}</Text>
          <Text style={styles.detail}>
            Pedido: {item.quantidade} {unit} · {formatBRL(item.preco)} / {unit}
          </Text>
        </View>
      </View>

      {editable ? (
        <QuantityInput
          value={chosen}
          onChange={onChange}
          max={item.quantidade}
          label={`Quantidade de ${item.produto} (${unit})`}
        />
      ) : (
        <Text style={[styles.result, shown === 0 && styles.resultNone]}>
          {shown > 0 ? `Aceito: ${shown} de ${item.quantidade} ${unit}` : "Não aceito"}
        </Text>
      )}

      {shown > 0 && (
        <Text style={styles.subtotal}>
          {shown} {unit} × {formatBRL(item.preco)} = {formatBRL(shown * item.preco)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.sm + 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  emoji: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  emojiText: { fontSize: 22 },
  titleBlock: { flex: 1, gap: 2 },
  product: { fontSize: 18, fontWeight: "700", color: colors.text },
  detail: { ...typography.hint, color: colors.textMuted },
  result: { ...typography.label, color: colors.primaryText },
  resultNone: { color: colors.textSubtle },
  subtotal: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
});
