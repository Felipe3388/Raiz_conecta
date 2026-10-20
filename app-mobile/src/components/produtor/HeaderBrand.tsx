import { StyleSheet, Text, View } from "react-native";
import { BrandMark } from "@/components/brand/BrandMark";
import { colors, radius, spacing } from "@/theme";

// Logo compacta do topo das telas logadas, como o cabeçalho do site.
export function HeaderBrand() {
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.tile}>
        <BrandMark size={24} color={colors.primary} />
      </View>
      <Text style={styles.wordmark}>
        Raiz<Text style={styles.accent}>Conecta</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tile: { padding: 6, backgroundColor: colors.primaryTint, borderRadius: radius.md - 2 },
  wordmark: { fontSize: 22, fontWeight: "900", color: colors.text },
  accent: { color: colors.primary },
});
