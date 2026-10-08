import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { OpportunityRow } from "@/components/produtor/OpportunityRow";
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
// Espaço no fim para o botão de ajuda não cobrir o último bloco.
const BOTTOM_SPACE = 96;

// Painel: um resumo simples da atividade do produtor, com atalhos para cada tela.
export default function PainelScreen() {
  const router = useRouter();
  const { status, summary, reload } = useDashboardScreen();

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
            : `Com base em ${summary.offersCount} ${summary.offersCount === 1 ? "oferta" : "ofertas"} e no preço médio de cada pedido.`}
        </Text>
      </View>

      <View style={styles.tiles}>
        <StatTile icon="grid-outline" value={summary.openDemands} label="Pedidos abertos" onPress={() => router.navigate("/mural")} />
        <StatTile icon="checkmark-done-outline" value={summary.offersCount} label="Minhas ofertas" onPress={() => router.navigate("/ofertas")} />
        <StatTile icon="leaf-outline" value={summary.savedProducts} label="No catálogo" onPress={() => router.navigate("/catalogo")} />
      </View>

      <SectionCard title="Receita por produto" icon="bar-chart-outline">
        {rows.length > 0 ? (
          <RevenueBars rows={rows} />
        ) : (
          <Text style={styles.empty}>Ainda não há receita para mostrar. Ela aparece quando você faz ofertas.</Text>
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
  tiles: { flexDirection: "row", gap: spacing.sm },
  list: { gap: spacing.sm },
  emptyBlock: { alignItems: "center", gap: spacing.sm + 4 },
  empty: { ...typography.body, color: colors.textMuted },
});
