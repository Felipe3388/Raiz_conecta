import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing } from "@/theme";
import type { CatalogProduct } from "@/types/produtor";
import { PriceTag } from "./PriceTag";
import { ProductAvatar } from "./ProductAvatar";

interface ProductRowProps {
  product: CatalogProduct;
  selected: boolean;
  onToggle: () => void;
  // Preço que o produtor pede (null = ainda não definiu) e como editá-lo. O lápis só aparece com o produto marcado.
  price: number | null;
  onEditPrice: () => void;
}

// Linha compacta do modo "Detalhes": miniatura, nome e, marcado, o preço com o lápis.
export function ProductRow({ product, selected, onToggle, price, onEditPrice }: ProductRowProps) {
  return (
    <View style={[styles.row, selected ? styles.rowOn : styles.rowOff]}>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityLabel={product.nome}
        aria-checked={selected}
        onPress={onToggle}
        pressedScale={0.99}
        containerStyle={styles.toggleContainer}
        style={styles.toggle}
      >
        <ProductAvatar product={product} size={36} />
        <Text style={[styles.name, selected && styles.nameOn]} numberOfLines={1}>
          {product.nome}
        </Text>
      </PressableScale>
      {selected && <PriceTag productName={product.nome} price={price} onPress={onEditPrice} />}
      {/* O círculo é só um atalho visual do mesmo toque; o leitor de tela já tem a linha ao lado. */}
      <PressableScale accessible={false} focusable={false} onPress={onToggle} pressedScale={0.9}>
        <View style={[styles.box, selected && styles.boxOn]}>
          {selected && <Ionicons name="checkmark" size={16} color={colors.surface} />}
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  rowOff: { backgroundColor: colors.surface, borderColor: colors.borderMid },
  rowOn: { backgroundColor: colors.warningTint, borderColor: colors.warning },
  toggleContainer: { flex: 1 },
  toggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
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
