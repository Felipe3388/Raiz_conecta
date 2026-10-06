import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";
import { colors } from "@/theme";
import { LeafIcon } from "./LeafIcon";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

const LEAVES = [
  { left: 8, size: 20, duration: 9000, delay: 0 },
  { left: 22, size: 28, duration: 11000, delay: 1800 },
  { left: 38, size: 16, duration: 8000, delay: 900 },
  { left: 54, size: 24, duration: 10000, delay: 3200 },
  { left: 68, size: 18, duration: 9500, delay: 2200 },
  { left: 82, size: 26, duration: 12000, delay: 600 },
  { left: 92, size: 16, duration: 8500, delay: 4000 },
] as const;

function FallingLeaf({ left, size, duration, delay, height }: (typeof LEAVES)[number] & { height: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, duration, delay]);

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          left: `${left}%`,
          opacity: progress.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.35, 0.35, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-40, height] }) },
            { translateX: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 24, -12] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-30deg", "200deg"] }) },
          ],
        },
      ]}
    >
      <LeafIcon size={size} color={colors.primary} />
    </Animated.View>
  );
}

// Folhinhas caindo devagar ao fundo: decoração, não atrapalha o toque.
export function FloatingLeaves() {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();

  if (reduced) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {LEAVES.map((leaf) => (
        <FallingLeaf key={leaf.left} {...leaf} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  leaf: { position: "absolute", top: 0 },
});
