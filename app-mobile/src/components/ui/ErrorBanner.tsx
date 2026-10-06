import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { colors, radius, spacing, typography } from "@/theme";

const SHAKE_STEPS = [-8, 8, -5, 5, 0];

export function ErrorBanner({ message }: { message: string }) {
  const reduced = useReducedMotion();
  const appear = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  // Ao aparecer, o aviso desce suavemente e balança de leve para chamar a atenção.
  useEffect(() => {
    if (reduced) {
      appear.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(appear, { toValue: 1, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.sequence(
        SHAKE_STEPS.map((toValue) =>
          Animated.timing(shake, { toValue, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
        ),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [reduced, appear, shake]);

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          opacity: appear,
          transform: [
            { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
            { translateX: shake },
          ],
        },
      ]}
    >
      <Ionicons name="alert-circle-outline" size={24} color={colors.dangerText} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  message: { ...typography.body, flex: 1, color: colors.dangerText },
});
