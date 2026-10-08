import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Collapse } from "@/components/motion/Collapse";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { usePasswordChecklist } from "@/hooks/usePasswordChecklist";
import { colors, spacing, typography } from "@/theme";

const ROW_STAGGER_MS = 50;

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

// Lista só o que a senha ainda precisa ter. Antes de digitar não aparece nada; os itens entram em
// sequência, ao cumprir um ele ganha o "feito" por um instante e sai deslizando; com tudo cumprido, a lista fecha.
export function PasswordChecklist({ password }: { password: string }) {
  const { items, anyShown } = usePasswordChecklist(password);

  return (
    <View aria-live="polite">
      <Collapse visible={anyShown}>
        <Text style={styles.title}>Sua senha precisa ter:</Text>
      </Collapse>
      {items.map((item, index) => (
        <Collapse key={item.label} visible={item.shown} delay={index * ROW_STAGGER_MS}>
          <View style={styles.rowSpacing}>
            <RequirementRow label={item.label} met={item.met} />
          </View>
        </Collapse>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.hint, color: colors.textMuted, fontWeight: "700", paddingTop: spacing.sm },
  rowSpacing: { paddingTop: spacing.xs + 2 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconSlot: { width: 20, height: 20 },
  checkIcon: { position: "absolute", top: 0, left: 0 },
  label: { ...typography.hint, color: colors.textMuted },
  labelMet: { color: colors.primaryText, fontWeight: "700" },
});
