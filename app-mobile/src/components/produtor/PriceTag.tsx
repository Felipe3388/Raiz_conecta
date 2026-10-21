import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { formatBRL } from "@/lib/format/currency";
import { colors, radius, spacing } from "@/theme";

interface PriceTagProps {
  productName: string;
  // O preço ofertado pelo produtor (o que ele pede), ou null se ainda não definiu.
  price: number | null;
  onPress: () => void;
}

// Botão com lápis que mostra o preço que o produtor pede por um produto e abre a edição dele.
export function PriceTag({ productName, price, onPress }: PriceTagProps) {
  const empty = price === null;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={
        empty ? `Definir preço de ${productName}` : `Editar preço de ${productName}. Atual: ${formatBRL(price)}`
      }
      hitSlop={4}
      onPress={onPress}
      pressedScale={0.97}
      style={[styles.tag, empty && styles.tagEmpty]}
    >
      <Ionicons name="pencil" size={14} color={empty ? colors.textMuted : colors.warningDarkest} />
      <Text style={[styles.text, empty && styles.textEmpty]}>{empty ? "Definir preço" : formatBRL(price)}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: colors.warningBorderStrong,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  tagEmpty: { borderStyle: "dashed", borderColor: colors.borderStrong },
  text: { fontSize: 14, fontWeight: "700", color: colors.warningDarkest },
  textEmpty: { color: colors.textMuted, fontWeight: "700" },
});
