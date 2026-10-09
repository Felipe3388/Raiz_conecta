import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Collapse } from "@/components/motion/Collapse";
import { PressableScale } from "@/components/motion/PressableScale";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { colors, radius, spacing } from "@/theme";
import type { CatalogProduct } from "@/types/produtor";
import { PriceTag } from "./PriceTag";
import { ProductAvatar } from "./ProductAvatar";

interface ProductCardProps {
  product: CatalogProduct;
  selected: boolean;
  onToggle: () => void;
  // Preço que o produtor pede (null = ainda não definiu) e como editá-lo. O lápis só aparece com o produto marcado.
  price: number | null;
  onEditPrice: () => void;
}

// Cartão do catálogo: toque para marcar ou desmarcar o que você produz; marcado, mostra o preço com um lápis.
export function ProductCard({ product, selected, onToggle, price, onEditPrice }: ProductCardProps) {
  const check = useRef(new Animated.Value(selected ? 1 : 0)).current;

  // O selo de "marcado" estoura com uma mola ao selecionar e some ao desmarcar.
  useEffect(() => {
    const animation = Animated.spring(check, {
      toValue: selected ? 1 : 0,
      speed: 24,
      bounciness: 14,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, check]);

  return (
    <View style={[styles.card, selected ? styles.cardOn : styles.cardOff]}>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityLabel={product.nome}
        aria-checked={selected}
        onPress={onToggle}
        style={styles.toggle}
      >
        <View>
          <ProductAvatar product={product} />
          <Animated.View style={[styles.check, { opacity: check, transform: [{ scale: check }] }]}>
            <Ionicons name="checkmark" size={16} color={colors.surface} />
          </Animated.View>
        </View>
        <Text style={[styles.name, selected && styles.nameOn]} numberOfLines={2}>
          {product.nome}
        </Text>
      </PressableScale>
      <Collapse visible={selected}>
        <View style={styles.priceRow}>
          <PriceTag productName={product.nome} price={price} onPress={onEditPrice} />
        </View>
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  cardOff: { backgroundColor: colors.surface, borderColor: colors.borderMid },
  cardOn: {
    backgroundColor: colors.warningTint,
    borderColor: colors.warning,
    // Brilho âmbar (cor de colors.warning com 25% de opacidade).
    boxShadow: "0px 3px 8px rgba(245, 158, 11, 0.25)",
  },
  toggle: { alignItems: "center", gap: spacing.sm + 2 },
  priceRow: { paddingTop: spacing.sm + 2, alignItems: "center" },
  check: {
    position: "absolute",
    right: -4,
    bottom: -2,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
    borderColor: colors.surface,
    borderWidth: 2,
    borderRadius: radius.full,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.textStrong, textAlign: "center" },
  nameOn: { color: colors.warningDarkest },
});
