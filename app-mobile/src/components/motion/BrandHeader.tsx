import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "@/components/brand/BrandMark";
import { colors, radius, spacing, typography } from "@/theme";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

interface BrandHeaderProps {
  size?: "md" | "lg";
  // Com fundo verde-claro atrás da logo (padrão). No cadastro a logo aparece sem fundo.
  framed?: boolean;
}

// Logo com vida: o broto cresce ao abrir, balança suavemente e gira quando tocado.
export function BrandHeader({ size = "md", framed = true }: BrandHeaderProps) {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const iconSize = size === "lg" ? 46 : 34;

  useEffect(() => {
    if (reduced) {
      grow.setValue(1);
      return;
    }
    const growing = Animated.timing(grow, {
      toValue: 1,
      duration: 900,
      delay: 150,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: USE_NATIVE_DRIVER,
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
    growing.start();
    swaying.start();
    return () => {
      growing.stop();
      swaying.stop();
    };
  }, [reduced, grow, sway]);

  function spinLogo() {
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
        accessibilityLabel="Logo do Raiz Conecta. Toque para girar."
        onPress={spinLogo}
        style={framed ? styles.tile : styles.plain}
      >
        <Animated.View
          style={{
            opacity: grow,
            transform: [
              { translateY: lift },
              { rotate },
              { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          }}
        >
          <BrandMark size={iconSize} color={colors.primary} />
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
  plain: { padding: 4 },
  wordmark: { ...typography.title, fontSize: 28, color: colors.text },
  wordmarkLarge: { fontSize: 34 },
  wordmarkAccent: { color: colors.primary },
});
