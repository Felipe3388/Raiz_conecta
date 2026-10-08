import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing } from "@/theme";
import type { CatalogProduct } from "@/types/produtor";
import { ProductAvatar } from "./ProductAvatar";

interface ProductRowProps {
  product: CatalogProduct;
  selected: boolean;
  onToggle: () => void;
}

// Linha compacta do modo "Detalhes": miniatura e nome, para ver muitos produtos de uma vez.
export function ProductRow({ product, selected, onToggle }: ProductRowProps) {
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={product.nome}
      aria-checked={selected}
      onPress={onToggle}
      pressedScale={0.99}
      style={[styles.row, selected ? styles.rowOn : styles.rowOff]}
    >
      <ProductAvatar product={product} size={36} />
      <Text style={[styles.name, selected && styles.nameOn]} numberOfLines={1}>
        {product.nome}
      </Text>
      <View style={[styles.box, selected && styles.boxOn]}>
        {selected && <Ionicons name="checkmark" size={16} color={colors.surface} />}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  rowOff: { backgroundColor: colors.surface, borderColor: colors.borderMid },
  rowOn: { backgroundColor: colors.warningTint, borderColor: colors.warning },
  name: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.textStrong },
  nameOn: { color: colors.warningDarkest },
  box: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  boxOn: { backgroundColor: colors.warning, borderColor: colors.warning },
});
