import { StyleSheet, Text, View } from "react-native";
import { formatBRL } from "@/lib/format/currency";
import { barShare, type ChartRow } from "@/lib/produtor/dashboard";
import { colors, spacing, typography } from "@/theme";

const BAR_HEIGHT = 20;
const BAR_END_RADIUS = 4;

// Gráfico de barras de uma série só (receita por produto): sem legenda, o título da seção já diz o que é.
// O valor fica escrito ao lado de cada barra, então o gráfico também funciona como uma tabela de leitura.
export function RevenueBars({ rows }: { rows: ChartRow[] }) {
  const max = Math.max(...rows.map((row) => row.revenue));

  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.produto} style={styles.row} accessible accessibilityLabel={`${row.produto}: ${formatBRL(row.revenue)}`}>
          <Text style={styles.name} numberOfLines={1}>
            {row.produto}
          </Text>
          <View style={styles.line}>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${barShare(row.revenue, max) * 100}%` }]} />
            </View>
            <Text style={styles.value}>{formatBRL(row.revenue)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { gap: spacing.xs },
  name: { ...typography.hint, fontWeight: "700", color: colors.textStrong },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  track: { flex: 1, height: BAR_HEIGHT, justifyContent: "center" },
  // Base reta junto ao eixo e ponta arredondada no valor.
  bar: {
    height: BAR_HEIGHT,
    backgroundColor: colors.primary,
    borderTopRightRadius: BAR_END_RADIUS,
    borderBottomRightRadius: BAR_END_RADIUS,
  },
  value: { ...typography.hint, fontWeight: "800", color: colors.text, minWidth: 92, textAlign: "right" },
});
