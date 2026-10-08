import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { colors, radius, spacing } from "@/theme";

const DOTS = [0, 1, 2];

// Três pontinhos que "respiram" enquanto o assistente prepara a resposta.
export function TypingIndicator() {
  const reduced = useReducedMotion();
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(phase, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, phase]);

  return (
    <View accessibilityLabel="O assistente está digitando" style={styles.bubble}>
      {DOTS.map((index) => {
        const start = index * 0.2;
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: reduced
                  ? 0.6
                  : phase.interpolate({
                      inputRange: [0, start, start + 0.2, start + 0.4, 1],
                      outputRange: [0.3, 0.3, 1, 0.3, 0.3],
                    }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginLeft: 40,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.textMuted },
});
