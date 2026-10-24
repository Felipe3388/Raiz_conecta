import { StyleSheet, Text, View } from "react-native";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatKg } from "@/lib/format/weight";
import type { PickItem } from "@/lib/delivery/plan";
import { productEmoji } from "@/lib/produtor/productVisual";
import { colors, radius, spacing, typography } from "@/theme";

interface PickListCardProps {
  title: string;
  items: PickItem[];
}

// "Separar hoje": cada produto com o que precisa estar separado, somando todos os pedidos dele.
export function PickListCard({ title, items }: PickListCardProps) {
  return (
    <SectionCard title={title} icon="basket-outline">
      <View style={styles.list}>
        {items.map((item) => (
          <View
            key={item.produto}
            style={styles.row}
            accessibilityLabel={`${item.produto}: ${formatKg(item.expectedKg)}`}
          >
            <View style={styles.emoji}>
              <Text maxFontSizeMultiplier={1} style={styles.emojiText}>
                {productEmoji(item.produto)}
              </Text>
            </View>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={styles.name}>{item.produto}</Text>
                <Text style={styles.kg}>{formatKg(item.expectedKg)}</Text>
              </View>
              <Text style={styles.detail}>
                {item.orders} {item.orders === 1 ? "pedido" : "pedidos"}
              </Text>
              <ProgressBar value={item.percent} />
              <Text style={item.remainingKg > 0 ? styles.missing : styles.done}>
                {item.remainingKg > 0 ? `Faltam ${formatKg(item.remainingKg)} para pesar` : "Tudo pesado"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm + 4 },
  emoji: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  emojiText: { fontSize: 24 },
  body: { flex: 1, gap: 6 },
  top: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  name: { ...typography.label, fontSize: 18, color: colors.text },
  kg: { fontSize: 18, fontWeight: "700", color: colors.primaryPressed },
  detail: { ...typography.hint, color: colors.textMuted },
  missing: { ...typography.hint, fontWeight: "700", color: colors.warningStrong },
  done: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
});
