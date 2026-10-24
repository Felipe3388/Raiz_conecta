import { StyleSheet, Text, View } from "react-native";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { QuantitySlider } from "@/components/ui/QuantitySlider";
import { formatBRL } from "@/lib/format/currency";
import { fulfilmentPercent } from "@/lib/produtor/demand";
import { productEmoji } from "@/lib/produtor/productVisual";
import { OFFER_TEXTS } from "@/content/proposalTexts";
import { colors, radius, spacing, typography } from "@/theme";
import type { ProposalItem } from "@/types/proposal";

interface OrderItemRowProps {
  item: ProposalItem;
  // Quantidade que a pessoa está escolhendo (só quando o pedido espera resposta).
  chosen: number;
  editable: boolean;
  onChange: (value: number) => void;
}

// Um produto do pedido que espera resposta: quanto o mercado pediu, o preço fixo e o campo de quantidade.
// Depois da resposta ele vira a linha resumida (ResultRow): só o que o produtor aceitou e quanto recebe por isso.
export function OrderItemRow({ item, chosen, editable, onChange }: OrderItemRowProps) {
  if (!editable) return <ResultRow item={item} />;
  const unit = item.unidade.toLowerCase();
  const kind: ResultKind = chosen === 0 ? "none" : chosen < item.quantidade ? "partial" : "full";
  const tone = RESULT_TONES[kind];
  const percent = fulfilmentPercent(chosen, item.quantidade);

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
            {formatBRL(item.preco)} / {unit}
          </Text>
        </View>
      </View>

      {/* Os dois números que importam, bem grandes: quanto o mercado pediu e quanto o produtor oferece. */}
      <View style={styles.figures}>
        <View accessibilityLabel={`Pedido: ${item.quantidade} ${unit}`} style={[styles.figure, styles.figureAsked]}>
          <Text style={styles.figureLabel}>{OFFER_TEXTS.asked}</Text>
          <Text style={styles.figureValue}>{item.quantidade}</Text>
          <Text style={styles.figureUnit}>{unit}</Text>
        </View>
        <View
          accessibilityLabel={`Você oferece: ${chosen} ${unit}`}
          style={[styles.figure, { backgroundColor: tone.background, borderColor: tone.strong }]}
        >
          <Text style={[styles.figureLabel, { color: tone.text }]}>{OFFER_TEXTS.offered}</Text>
          <Text style={[styles.figureValue, { color: tone.text }]}>{chosen}</Text>
          <Text style={[styles.figureUnit, { color: tone.text }]}>{unit}</Text>
        </View>
      </View>

      <QuantitySlider
        value={chosen}
        onChange={onChange}
        max={item.quantidade}
        label={`Ajustar quantidade de ${item.produto}`}
        color={tone.strong}
      />
      <Text style={[styles.progress, { color: tone.text }]}>{OFFER_TEXTS.progress(percent, kind)}</Text>

      <QuantityInput
        value={chosen}
        onChange={onChange}
        max={item.quantidade}
        label={`Quantidade de ${item.produto} (${unit})`}
      />
      {chosen > 0 && (
        <Text style={styles.subtotal}>
          {chosen} {unit} × {formatBRL(item.preco)} = {formatBRL(chosen * item.preco)}
        </Text>
      )}
    </View>
  );
}

// Resultado de um produto, em três cores: verde quando aceitou tudo, âmbar quando aceitou só uma parte e cinza
// quando não aceitou. À esquerda o produto e o preço; à direita o quanto aceitou e o valor.
function ResultRow({ item }: { item: ProposalItem }) {
  const unit = item.unidade.toLowerCase();
  const accepted = item.aceita ?? 0;
  const kind: ResultKind = accepted === 0 ? "none" : accepted < item.quantidade ? "partial" : "full";
  const tone = RESULT_TONES[kind];

  return (
    <View
      accessibilityLabel={`${item.produto}: ${kind === "none" ? "não aceito" : `aceito ${accepted} de ${item.quantidade} ${unit}`}`}
      style={[styles.result, { backgroundColor: tone.background }]}
    >
      <View style={[styles.emoji, { backgroundColor: tone.emoji }]}>
        <Text maxFontSizeMultiplier={1} style={styles.emojiText}>
          {productEmoji(item.produto)}
        </Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={[styles.product, kind === "none" && styles.muted]}>{item.produto}</Text>
        {kind === "none" ? (
          <Text style={styles.detail}>Não aceito</Text>
        ) : (
          <>
            <Text style={[styles.quantity, { color: tone.text }]}>
              {kind === "partial" ? `${accepted} de ${item.quantidade} ${unit}` : `${accepted} ${unit}`}
            </Text>
            <Text style={styles.detail}>
              {formatBRL(item.preco)} / {unit}
            </Text>
          </>
        )}
      </View>
      {kind !== "none" && <Text style={[styles.amount, { color: tone.text }]}>{formatBRL(accepted * item.preco)}</Text>}
    </View>
  );
}

type ResultKind = "full" | "partial" | "none";

const RESULT_TONES: Record<ResultKind, { background: string; emoji: string; text: string; strong: string }> = {
  full: { background: colors.surface, emoji: colors.primaryTint, text: colors.primaryText, strong: colors.primary },
  partial: {
    background: colors.warningTint,
    emoji: colors.warningSoft,
    text: colors.warningDark,
    strong: colors.warningStrong,
  },
  none: { background: colors.surfaceMuted, emoji: colors.border, text: colors.textSubtle, strong: colors.borderStrong },
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.sm + 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  emoji: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  emojiText: { fontSize: 22 },
  titleBlock: { flex: 1, gap: 2 },
  product: { fontSize: 18, fontWeight: "700", color: colors.text },
  muted: { color: colors.textSubtle },
  detail: { ...typography.hint, color: colors.textMuted },
  quantity: { ...typography.label, fontWeight: "700" },
  amount: { fontSize: 18, fontWeight: "700", ...typography.numeric },
  figures: { flexDirection: "row", gap: spacing.sm },
  figure: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  figureAsked: { backgroundColor: colors.surface, borderColor: colors.borderMid },
  figureLabel: { ...typography.caption, fontWeight: "700", letterSpacing: 0.6, color: colors.textMuted },
  figureValue: { fontSize: 34, lineHeight: 40, fontWeight: "700", ...typography.numeric, color: colors.text },
  figureUnit: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  progress: { ...typography.hint, fontWeight: "700", textAlign: "center" },
  subtotal: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
});
