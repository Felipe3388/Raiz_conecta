import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, radius, spacing, typography } from "@/theme";
import { LEAF_PATHS } from "./LeafIcon";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const DASH_LENGTH = 70;

interface BrandHeaderProps {
  size?: "md" | "lg";
}

// Logo com vida: a folha se desenha ao abrir, balança suavemente e gira quando tocada.
export function BrandHeader({ size = "md" }: BrandHeaderProps) {
  const reduced = useReducedMotion();
  const draw = useRef(new Animated.Value(DASH_LENGTH)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const iconSize = size === "lg" ? 40 : 30;

  useEffect(() => {
    if (reduced) {
      draw.setValue(0);
      return;
    }
    const drawing = Animated.timing(draw, {
      toValue: 0,
      duration: 900,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // propriedades do SVG não aceitam driver nativo
    });
    const swaying = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    drawing.start();
    swaying.start();
    return () => {
      drawing.stop();
      swaying.stop();
    };
  }, [reduced, draw, sway]);

  function spinLeaf() {
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  const rotate = Animated.add(
    sway.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] }),
    spin.interpolate({ inputRange: [0, 1], outputRange: [0, 360] }),
  ).interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] });
  const lift = sway.interpolate({ inputRange: [0, 1], outputRange: [1.5, -1.5] });

  return (
    <View style={styles.row} accessibilityRole="header">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Folha do Raiz Conecta. Toque para girar."
        onPress={spinLeaf}
        style={styles.tile}
      >
        <Animated.View style={{ transform: [{ translateY: lift }, { rotate }] }}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            {LEAF_PATHS.map((d) => (
              <AnimatedPath
                key={d}
                d={d}
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={DASH_LENGTH}
                strokeDashoffset={draw}
              />
            ))}
          </Svg>
        </Animated.View>
      </Pressable>
      <Text style={[styles.wordmark, size === "lg" && styles.wordmarkLarge]}>
        Raiz<Text style={styles.wordmarkAccent}>Conecta</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  tile: { padding: 10, backgroundColor: colors.primaryTint, borderRadius: radius.md },
  wordmark: { ...typography.title, fontSize: 28, color: colors.text },
  wordmarkLarge: { fontSize: 34 },
  wordmarkAccent: { color: colors.primary },
});
