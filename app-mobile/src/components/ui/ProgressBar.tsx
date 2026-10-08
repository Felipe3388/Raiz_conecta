import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { colors, radius } from "@/theme";

interface ProgressBarProps {
  // De 0 a 100.
  value: number;
  color?: string;
}

// Barra de progresso: o preenchimento cresce suavemente até o valor, como no site.
export function ProgressBar({ value, color = colors.primary }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const percent = Math.min(100, Math.max(0, value));
  const fill = useRef(new Animated.Value(reduced ? percent : 0)).current;

  useEffect(() => {
    if (reduced) {
      fill.setValue(percent);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: percent,
      duration: 600,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // largura em % não aceita driver nativo
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, percent, fill]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={styles.track}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: fill.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.borderMid,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.full },
});
