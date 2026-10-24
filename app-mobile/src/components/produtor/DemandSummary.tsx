import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { DEMAND_TEXTS } from "@/content/proposalTexts";
import { demandPercent, type DemandLine } from "@/lib/produtor/demand";
import { colors, elevation, radius, spacing, typography } from "@/theme";

interface DemandSummaryProps {
  lines: DemandLine[];
  open: boolean;
  onToggle: () => void;
}

// O resumo no topo de Ofertas: para cada produto, quanto os mercados pedem no total e quanto o produtor já cobre
// (o que aceitou mais o que está escolhendo). Fechado mostra só o total; aberto, cada produto com a sua barra.
export function DemandSummary({ lines, open, onToggle }: DemandSummaryProps) {
  if (lines.length === 0) return null;
  const percent = demandPercent(lines);
  const summary = DEMAND_TEXTS.summary(percent, lines.length);

  return (
    <View style={styles.card}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${DEMAND_TEXTS.title}, ${summary}`}
        accessibilityHint={open ? DEMAND_TEXTS.hide : DEMAND_TEXTS.show}
        aria-expanded={open}
        onPress={onToggle}
        style={styles.header}
      >
        <View style={styles.icon}>
          <Ionicons name="stats-chart" size={22} color={colors.primaryPressed} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{DEMAND_TEXTS.title}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
      </PressableScale>
      <Bar accepted={percent} choosing={0} />

      {open && (
        <View style={styles.lines}>
          <Text style={styles.hint}>{DEMAND_TEXTS.hint}</Text>
          {lines.map((line) => (
            <DemandRow key={line.produto} line={line} />
          ))}
        </View>
      )}
    </View>
  );
}

function DemandRow({ line }: { line: DemandLine }) {
  const acceptedPercent = line.requested > 0 ? (line.accepted / line.requested) * 100 : 0;
  const choosingPercent = line.requested > 0 ? (line.choosing / line.requested) * 100 : 0;

  return (
    <View
      accessibilityLabel={`${line.produto}: ${line.requested} ${line.unit} pedidos em ${DEMAND_TEXTS.markets(line.markets)}, você oferece ${line.offered} ${line.unit}, ${line.percent}%`}
      style={styles.row}
    >
      <View style={styles.rowTop}>
        <View style={styles.rowTitle}>
          <Text style={styles.product}>{line.produto}</Text>
          <Text style={styles.markets}>{DEMAND_TEXTS.markets(line.markets)}</Text>
        </View>
        <Text style={styles.percent}>{line.percent}%</Text>
      </View>
      <View style={styles.figures}>
        <View style={styles.figure}>
          <Text style={styles.figureValue}>{line.requested}</Text>
          <Text style={styles.figureLabel}>
            {line.unit} {DEMAND_TEXTS.asked}
          </Text>
        </View>
        <View style={styles.figure}>
          <Text style={[styles.figureValue, styles.figureOffered]}>{line.offered}</Text>
          <Text style={[styles.figureLabel, styles.figureOffered]}>
            {line.unit} {DEMAND_TEXTS.offered}
          </Text>
        </View>
      </View>
      <Bar accepted={acceptedPercent} choosing={choosingPercent} />
    </View>
  );
}

// A barra da demanda: a parte já aceita (verde forte) e a que o produtor está escolhendo agora (verde claro).
function Bar({ accepted, choosing }: { accepted: number; choosing: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.accepted, { width: `${Math.min(accepted, 100)}%` }]} />
      <View style={[styles.choosing, { width: `${Math.min(choosing, 100 - Math.min(accepted, 100))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    borderRadius: radius.lg,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2, minHeight: 48 },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  titleBlock: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  summary: { ...typography.hint, fontWeight: "700", color: colors.primaryText },
  hint: { ...typography.hint, color: colors.textMuted },
  lines: { gap: spacing.md, paddingTop: spacing.sm },
  row: { gap: spacing.xs + 2, padding: spacing.sm + 4, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  rowTitle: { flex: 1, gap: 0 },
  product: { fontSize: 17, fontWeight: "700", color: colors.text, flexShrink: 1 },
  markets: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
  figures: { flexDirection: "row", alignItems: "flex-end", gap: spacing.lg },
  figure: { gap: 0 },
  figureValue: { fontSize: 26, lineHeight: 30, fontWeight: "700", ...typography.numeric, color: colors.text },
  figureLabel: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
  figureOffered: { color: colors.primaryText },
  percent: { fontSize: 24, fontWeight: "700", ...typography.numeric, color: colors.primaryText },
  track: {
    flexDirection: "row",
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  accepted: { height: "100%", backgroundColor: colors.primaryPressed },
  choosing: { height: "100%", backgroundColor: colors.primary, opacity: 0.55 },
});
