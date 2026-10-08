import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Button } from "@/components/ui/Button";
import { useFabLift } from "@/hooks/useAssistant";
import { colors, spacing, typography } from "@/theme";

interface SaveBarProps {
  selectedCount: number;
  isSaving: boolean;
  onSave: () => void;
}

// Barra que sobe do rodapé assim que há escolhas ainda não salvas: o botão fica sempre ao alcance do dedo.
export function SaveBar({ selectedCount, isSaving, onSave }: SaveBarProps) {
  const reduced = useReducedMotion();
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [height, setHeight] = useState(0);

  // O botão de ajuda sobe junto, para não ficar por cima de "Salvar Escolhas".
  useFabLift(height);

  useEffect(() => {
    if (reduced) {
      rise.setValue(1);
      return;
    }
    const animation = Animated.timing(rise, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, rise]);

  return (
    <Animated.View
      onLayout={(event) => setHeight(Math.ceil(event.nativeEvent.layout.height))}
      style={[
        styles.bar,
        {
          opacity: rise,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.count}>
          {selectedCount} {selectedCount === 1 ? "produto marcado" : "produtos marcados"}
        </Text>
        <View style={styles.button}>
          <Button label="Salvar Escolhas" variant="amber" isLoading={isSaving} onPress={onSave} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.warningBorder,
    boxShadow: "0px -3px 10px rgba(0, 0, 0, 0.1)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, width: "100%", maxWidth: 720, alignSelf: "center" },
  count: { ...typography.label, flex: 1, color: colors.warningText },
  button: { flexShrink: 0 },
});
