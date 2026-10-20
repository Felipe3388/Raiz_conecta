import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { ProposalRow } from "@/components/produtor/ProposalRow";
import { PriceInsightRow } from "@/components/produtor/PriceInsightRow";
import { RevenueBars } from "@/components/produtor/RevenueBars";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { StatTile } from "@/components/produtor/StatTile";
import { Button } from "@/components/ui/Button";
import { FormScreen } from "@/components/ui/FormScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import { useDashboardScreen } from "@/hooks/useDashboardScreen";
import { deliveryDayLabel } from "@/lib/delivery/schedule";
import { formatBRL } from "@/lib/format/currency";
import { chartRows } from "@/lib/produtor/dashboard";
import { colors, radius, spacing, typography } from "@/theme";

const MAX_CHART_ROWS = 5;

function deliveriesText(count: number, dayLabel: string): string {
  if (count === 0) return `Nada para separar ou entregar até ${dayLabel}.`;
  return count === 1
    ? `1 pedido para separar e entregar até ${dayLabel}.`
    : `${count} pedidos para separar e entregar até ${dayLabel}.`;
}
// Espaço no fim para o botão de ajuda não cobrir o último bloco.
const BOTTOM_SPACE = 96;

// Painel: um resumo simples da atividade do produtor, com atalhos para cada tela.
export default function PainelScreen() {
  const router = useRouter();
  const { status, summary, reload, prices, nextDelivery, now } = useDashboardScreen();

  if (status === "loading") return <PageLoader />;
  if (status === "error") return <LoadError onRetry={reload} />;

  const rows = chartRows(summary.revenueByProduct, MAX_CHART_ROWS);
  const nextDayLabel = nextDelivery ? deliveryDayLabel(nextDelivery.day, now).toLowerCase() : "";

  return (
    <FormScreen edges={[]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <View style={styles.top}>
        <ScreenHeading title="Meu Painel" />
        <Text style={styles.subtitle}>Veja como está a sua atividade.</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Receita estimada do que você aceitou</Text>
        <Text style={styles.heroValue} accessibilityRole="header">
          {formatBRL(summary.estimatedRevenue)}
        </Text>
        <Text style={styles.heroNote}>
          {summary.acceptedCount === 0
            ? "Quando você aceitar pedidos em Ofertas, o valor aparece aqui."
            : `Com base em ${summary.acceptedCount} ${summary.acceptedCount === 1 ? "pedido aceito" : "pedidos aceitos"} e no preço fixo de cada produto.`}
        </Text>
      </View>

      {nextDelivery !== null && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Próxima entrega: ${deliveriesText(nextDelivery.pending, nextDayLabel)} Toque para abrir.`}
          onPress={() => router.navigate("/entregas")}
          style={[styles.deliveries, nextDelivery.pending > 0 && styles.deliveriesDue]}
        >
          <Ionicons
            name="cube-outline"
            size={26}
            color={nextDelivery.pending > 0 ? colors.warningStrong : colors.primary}
          />
          <View style={styles.deliveriesText}>
            <Text style={styles.deliveriesTitle}>Próxima entrega</Text>
            <Text style={styles.deliveriesNote}>{deliveriesText(nextDelivery.pending, nextDayLabel)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </PressableScale>
      )}

      <View style={styles.tiles}>
        <StatTile
          icon="time-outline"
          value={summary.pendingCount}
          label="Para responder"
          onPress={() => router.navigate("/ofertas")}
        />
        <StatTile
          icon="checkmark-done-outline"
          value={summary.acceptedCount}
          label="Aceitos"
          onPress={() => router.navigate("/ofertas")}
        />
        <StatTile
          icon="nutrition-outline"
          value={summary.savedProducts}
          label="No catálogo"
          onPress={() => router.navigate("/catalogo")}
        />
      </View>

      <SectionCard title="Receita por produto" icon="bar-chart-outline">
        {rows.length > 0 ? (
          <RevenueBars rows={rows} />
        ) : (
          <Text style={styles.empty}>Ainda não há receita para mostrar. Ela aparece quando você aceita pedidos.</Text>
        )}
      </SectionCard>

      <SectionCard
        title="Preços e vendas"
        description="O que está vendendo mais ou menos, pelos preços dos produtores."
        icon="pricetags-outline"
        iconColor={colors.warning}
      >
        {summary.savedProducts === 0 ? (
          <Text style={styles.empty}>
            Quando você marcar produtos no Catálogo, as médias de preço e venda deles aparecem aqui.
          </Text>
        ) : prices.status === "error" ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.empty}>Não foi possível carregar os preços.</Text>
            <Button label="Tentar de novo" variant="amberOutline" onPress={prices.reload} />
          </View>
        ) : prices.insights.length === 0 ? (
          <Text style={styles.empty}>
            {prices.status === "loading"
              ? "Carregando os preços..."
              : "Ainda não há vendas registradas para os seus produtos."}
          </Text>
        ) : (
          <View style={styles.list}>
            <Text style={styles.signalSummary} accessibilityRole="summary">
              {prices.signals.up} vendendo mais · {prices.signals.steady} estáveis · {prices.signals.down} vendendo
              menos
            </Text>
            {prices.insights.map((insight) => (
              <PriceInsightRow key={insight.produto} insight={insight} />
            ))}
          </View>
        )}
      </SectionCard>

      <SectionCard title="Responder primeiro" icon="time-outline" iconColor={colors.warning}>
        {summary.urgent.length > 0 ? (
          <View style={styles.list}>
            {summary.urgent.map((proposal) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
                now={now}
                onPress={() => router.navigate("/ofertas")}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
            <Text style={styles.empty}>Nenhum pedido esperando resposta agora. Volte mais tarde.</Text>
          </View>
        )}
      </SectionCard>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  top: { gap: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted },
  hero: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  heroLabel: { ...typography.label, color: colors.primaryText },
  heroValue: { fontSize: 48, lineHeight: 56, fontWeight: "900", color: colors.text },
  heroNote: { ...typography.hint, color: colors.textMuted },
  deliveries: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  deliveriesDue: { backgroundColor: colors.warningTint, borderColor: colors.warningBorder },
  deliveriesText: { flex: 1, gap: 2 },
  deliveriesTitle: { ...typography.label, color: colors.text },
  deliveriesNote: { ...typography.hint, color: colors.textMuted },
  tiles: { flexDirection: "row", gap: spacing.sm },
  list: { gap: spacing.sm },
  emptyBlock: { alignItems: "center", gap: spacing.sm + 4 },
  empty: { ...typography.body, color: colors.textMuted },
  signalSummary: { ...typography.hint, fontWeight: "800", color: colors.textStrong },
});
