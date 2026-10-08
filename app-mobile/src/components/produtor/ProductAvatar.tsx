import { Image, StyleSheet, Text, View } from "react-native";
import { productVisual } from "@/lib/produtor/productVisual";
import { colors } from "@/theme";
import type { CatalogProduct } from "@/types/produtor";

interface ProductAvatarProps {
  product: CatalogProduct;
  size?: number;
}

// Foto redonda do produto; sem foto, o emoji do alimento ocupa o lugar.
export function ProductAvatar({ product, size = 64 }: ProductAvatarProps) {
  const visual = productVisual(product);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (visual.kind === "image") {
    return (
      <Image
        accessibilityLabel={`Foto de ${product.nome}`}
        source={{ uri: visual.uri }}
        style={[styles.image, circle]}
      />
    );
  }

  return (
    <View style={[styles.emojiCircle, circle]}>
      <Text style={{ fontSize: size * 0.5 }}>{visual.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.border },
  emojiCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
});
