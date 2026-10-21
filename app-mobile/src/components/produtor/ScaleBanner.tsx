import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { colors, radius, spacing, typography } from "@/theme";

// Destaque na aba Mais enquanto o produtor ainda não conectou a balança: leva à tela dos 2 passos.
export function ScaleBanner({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${SCALE_SETUP.banner.title}. ${SCALE_SETUP.banner.description}`}
      onPress={onPress}
      pressedScale={0.985}
      style={styles.card}
    >
      <View style={styles.icon}>
        <Ionicons name="scale-outline" size={26} color={colors.primaryContrast} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{SCALE_SETUP.banner.title}</Text>
        <Text style={styles.description}>{SCALE_SETUP.banner.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.primaryPressed} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  text: { flex: 1, gap: 2 },
  title: { ...typography.button, fontSize: 16, color: colors.primaryPressed },
  description: { ...typography.hint, color: colors.textStrong },
});
