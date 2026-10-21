import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { Badge } from "@/components/ui/Badge";
import { URGENT_SECONDS } from "@/content/proposalTexts";
import { countdownLabel } from "@/lib/produtor/proposals";
import { colors, elevation, radius, spacing, typography } from "@/theme";

interface MarketCardProps {
  mercado: string;
  orderCount: number;
  // Quantos pedidos esperam resposta (0 não mostra o aviso).
  pendingCount: number;
  // Quanto falta para o pedido pendente mais urgente do mercado (null se nenhum espera resposta).
  secondsLeft: number | null;
  open: boolean;
  onToggle: () => void;
  // Os pedidos do mercado, mostrados quando o cartão está aberto.
  children: ReactNode;
}

// Um mercado, com o símbolo dele. Um mercado pode ter um ou vários pedidos: tocar abre a lista de pedidos.
export function MarketCard({
  mercado,
  orderCount,
  pendingCount,
  secondsLeft,
  open,
  onToggle,
  children,
}: MarketCardProps) {
  const orders = orderCount === 1 ? "1 pedido" : `${orderCount} pedidos`;

  return (
    <View style={styles.card}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${mercado}, ${orders}`}
        accessibilityHint={open ? "Toque para fechar os pedidos." : "Toque para ver os pedidos."}
        aria-expanded={open}
        onPress={onToggle}
        style={styles.header}
      >
        <View style={styles.symbol}>
          <Ionicons name="storefront-outline" size={28} color={colors.primaryPressed} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{mercado}</Text>
          <Text style={styles.count}>{orders}</Text>
        </View>
        <View style={styles.status}>
          {pendingCount > 0 && <Badge label={`${pendingCount} para responder`} variant="warning" dot />}
          {secondsLeft !== null && (
            <View
              style={[styles.time, secondsLeft <= URGENT_SECONDS && styles.timeUrgent]}
              accessibilityRole="timer"
              accessibilityLabel={`Tempo para responder: ${countdownLabel(secondsLeft)}`}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={secondsLeft <= URGENT_SECONDS ? colors.danger : colors.warningStrong}
              />
              <Text style={[styles.timeText, secondsLeft <= URGENT_SECONDS && styles.timeTextUrgent]}>
                {countdownLabel(secondsLeft)}
              </Text>
            </View>
          )}
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
        </View>
      </PressableScale>

      {open && <View style={styles.orders}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    borderRadius: radius.lg,
  },
  header: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm, minHeight: 56 },
  symbol: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  titleBlock: { flex: 1, minWidth: 140, gap: 2 },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  count: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  status: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  time: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 76,
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  timeUrgent: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  timeText: { ...typography.hint, fontWeight: "700", color: colors.warningDark },
  timeTextUrgent: { color: colors.dangerText },
  orders: { gap: spacing.md },
});
