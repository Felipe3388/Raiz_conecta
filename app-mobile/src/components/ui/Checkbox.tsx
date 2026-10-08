import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { colors, spacing } from "@/theme";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  const pop = useRef(new Animated.Value(checked ? 1 : 0)).current;

  // O "visto" aparece com um pulinho.
  useEffect(() => {
    Animated.spring(pop, {
      toValue: checked ? 1 : 0,
      speed: 30,
      bounciness: 14,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [checked, pop]);

  return (
    <PressableScale
      accessibilityRole="checkbox"
      aria-checked={checked}
      onPress={() => onChange(!checked)}
      pressedScale={0.98}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Ionicons name="checkmark" size={20} color={colors.primaryContrast} />
        </Animated.View>
      </View>
      <View style={styles.label}>{children}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm + 4 },
  box: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  boxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { flex: 1 },
});
