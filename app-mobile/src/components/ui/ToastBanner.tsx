import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { colors, radius, spacing, typography } from "@/theme";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const TONES: Record<ToastTone, { icon: ComponentProps<typeof Ionicons>["name"]; color: string; background: string; border: string }> = {
  success: { icon: "checkmark-circle", color: colors.primary, background: colors.primarySoft, border: colors.primaryBorder },
  error: { icon: "close-circle", color: colors.danger, background: colors.dangerSoft, border: colors.dangerBorder },
  warning: { icon: "alert-circle", color: colors.warning, background: colors.warningTint, border: colors.warningBorder },
  info: { icon: "information-circle", color: colors.info, background: colors.infoSoft, border: colors.infoBorder },
};

interface ToastBannerProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

// Aviso que desce do topo e some sozinho; um toque o fecha.
export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [toast, reduced, progress]);

  if (!toast) return null;
  const tone = TONES[toast.tone];

  return (
    <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.safe}>
      <Animated.View
        style={{
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        }}
      >
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={`${toast.title}. ${toast.description ?? ""}`}
          onPress={onDismiss}
          style={[styles.toast, { backgroundColor: tone.background, borderColor: tone.border }]}
        >
          <Ionicons name={tone.icon} size={26} color={tone.color} />
          <View style={styles.texts}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.description && <Text style={styles.description}>{toast.description}</Text>}
          </View>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: spacing.md, alignItems: "center", zIndex: 100 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    width: "100%",
    maxWidth: 520,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
  },
  texts: { flex: 1, gap: 2 },
  title: { ...typography.label, color: colors.text },
  description: { ...typography.hint, color: colors.textMuted },
});
