import { StyleSheet, Text, View } from "react-native";
import { itemStatus } from "@/content/deliveryTexts";
import type { DeliveryCard } from "@/lib/delivery/card";
import { formatKg } from "@/lib/format/weight";
import { productEmoji } from "@/lib/produtor/productVisual";
import { colors, radius, spacing, typography } from "@/theme";
import { TONE_COLORS } from "./tones";

interface OrderItemRowProps {
  card: DeliveryCard;
  // Destaca o produto que está sendo pesado agora.
  current?: boolean;
}

// Um produto dentro do pedido: o que e quanto o mercado pediu, e como está a pesagem dele.
export function OrderItemRow({ card, current = false }: OrderItemRowProps) {
  const { delivery } = card;
  const status = itemStatus(card);
  const tone = TONE_COLORS[status.tone];

  return (
    <View
      style={[styles.row, current && styles.current]}
      accessibilityLabel={`${delivery.produto}, ${formatKg(card.expectedKg)}. ${status.label}.`}
    >
      <Text maxFontSizeMultiplier={1} style={styles.emoji}>
        {productEmoji(delivery.produto)}
      </Text>
      <View style={styles.text}>
        <Text style={styles.product}>{delivery.produto}</Text>
        <Text style={styles.detail}>
          {delivery.unidade.toLowerCase() === "kg"
            ? formatKg(card.expectedKg)
            : `${delivery.quantidade} ${delivery.unidade.toLowerCase()} · ${formatKg(card.expectedKg)}`}
        </Text>
      </View>
      <View style={[styles.status, { backgroundColor: tone.soft, borderColor: tone.border }]}>
        <Text style={[styles.statusText, { color: tone.text }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  current: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emoji: { fontSize: 24 },
  text: { flex: 1, gap: 1 },
  product: { ...typography.label, fontSize: 17, color: colors.text },
  detail: { ...typography.hint, color: colors.textMuted },
  status: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, borderWidth: 1 },
  statusText: { fontSize: 13, fontWeight: "700" },
});
