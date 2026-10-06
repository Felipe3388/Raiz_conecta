import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { passwordRequirements } from "@/lib/auth/password";
import { colors, spacing, typography } from "@/theme";

function RequirementRow({ label, met }: { label: string; met: boolean }) {
  const pop = useRef(new Animated.Value(met ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: met ? 1 : 0,
      speed: 30,
      bounciness: 16,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [met, pop]);

  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${met ? "feito" : "falta"}`}>
      <View style={styles.iconSlot}>
        <Ionicons name="ellipse-outline" size={20} color={colors.borderStrong} />
        <Animated.View style={[styles.checkIcon, { transform: [{ scale: pop }], opacity: pop }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </Animated.View>
      </View>
      <Text style={[styles.label, met && styles.labelMet]}>{label}</Text>
    </View>
  );
}

// Lista do que a senha precisa ter; cada item "acende" quando é cumprido.
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sua senha precisa ter:</Text>
      {passwordRequirements(password).map((requirement) => (
        <RequirementRow key={requirement.label} {...requirement} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs + 2 },
  title: { ...typography.hint, color: colors.textMuted, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconSlot: { width: 20, height: 20 },
  checkIcon: { position: "absolute", top: 0, left: 0 },
  label: { ...typography.hint, color: colors.textMuted },
  labelMet: { color: colors.primaryText, fontWeight: "700" },
});
