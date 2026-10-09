import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { OpportunityRow } from "@/components/produtor/OpportunityRow";
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
import { formatBRL } from "@/lib/format/currency";
import { chartRows } from "@/lib/produtor/dashboard";
import { colors, radius, spacing, typography } from "@/theme";

const MAX_CHART_ROWS = 5;

function deliveriesText(count: number): string {
  if (count === 0) return "Nada para separar ou entregar hoje.";
  return count === 1 ? "1 entrega para separar ou entregar." : `${count} entregas para separar ou entregar.`;
}
// Espaço no fim para o botão de ajuda não cobrir o último bloco.
const BOTTOM_SPACE = 96;

// Painel: um resumo simples da atividade do produtor, com atalhos para cada tela.
export default function PainelScreen() {
  const router = useRouter();
  const { status, summary, reload, prices, deliveriesToday } = useDashboardScreen();

  if (status === "loading") return <PageLoader />;
  if (status === "error") return <LoadError onRetry={reload} />;

  const rows = chartRows(summary.revenueByProduct, MAX_CHART_ROWS);

  return (
    <FormScreen edges={[]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <View style={styles.top}>
        <ScreenHeading title="Meu Painel" />
        <Text style={styles.subtitle}>Veja como está a sua atividade.</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Receita estimada das suas ofertas</Text>
        <Text style={styles.heroValue} accessibilityRole="header">
          {formatBRL(summary.estimatedRevenue)}
        </Text>
        <Text style={styles.heroNote}>
          {summary.offersCount === 0
            ? "Quando você fizer ofertas no Mural, o valor aparece aqui."
            : `Com base em ${summary.offersCount} ${summary.offersCount === 1 ? "oferta" : "ofertas"} e no preço combinado ou estimado de cada uma.`}
        </Text>
      </View>

      {deliveriesToday !== null && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Entregas de hoje: ${deliveriesText(deliveriesToday)} Toque para abrir.`}
          onPress={() => router.navigate("/entregas")}
          style={[styles.deliveries, deliveriesToday > 0 && styles.deliveriesDue]}
        >
          <Ionicons name="cube-outline" size={26} color={deliveriesToday > 0 ? colors.warningStrong : colors.primary} />
          <View style={styles.deliveriesText}>
            <Text style={styles.deliveriesTitle}>Entregas de hoje</Text>
            <Text style={styles.deliveriesNote}>{deliveriesText(deliveriesToday)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </PressableScale>
      )}

      <View style={styles.tiles}>
        <StatTile
          icon="grid-outline"
          value={summary.openDemands}
          label="Pedidos abertos"
          onPress={() => router.navigate("/mural")}
        />
        <StatTile
          icon="checkmark-done-outline"
          value={summary.offersCount}
          label="Minhas ofertas"
          onPress={() => router.navigate("/ofertas")}
        />
        <StatTile
          icon="leaf-outline"
          value={summary.savedProducts}
          label="No catálogo"
          onPress={() => router.navigate("/catalogo")}
        />
      </View>

      <SectionCard title="Receita por produto" icon="bar-chart-outline">
        {rows.length > 0 ? (
          <RevenueBars rows={rows} />
        ) : (
          <Text style={styles.empty}>Ainda não há receita para mostrar. Ela aparece quando você faz ofertas.</Text>
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

      <SectionCard title="Maiores oportunidades" icon="trending-up-outline" iconColor={colors.warning}>
        {summary.savedProducts === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.empty}>Marque no Catálogo o que você produz para ver os pedidos desses produtos.</Text>
            <Button label="Abrir Catálogo" variant="amber" onPress={() => router.navigate("/catalogo")} />
          </View>
        ) : summary.opportunities.length > 0 ? (
          <View style={styles.list}>
            {summary.opportunities.map((opportunity) => (
              <OpportunityRow
                key={opportunity.demand.id}
                opportunity={opportunity}
                onPress={() => router.navigate("/mural")}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
            <Text style={styles.empty}>Nenhum pedido aberto agora. Volte mais tarde.</Text>
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
