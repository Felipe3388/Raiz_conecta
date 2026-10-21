import { ActivityIndicator, StyleSheet, Text, type ViewStyle } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";

type Variant = "primary" | "outline" | "ghost" | "danger" | "amber" | "amberOutline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
}

interface VariantStyle {
  background: string;
  pressed: string;
  text: string;
  border?: string;
}

const variants: Record<Variant, VariantStyle> = {
  primary: {
    background: colors.primary,
    pressed: colors.primaryPressed,
    text: colors.primaryContrast,
  },
  // "Tinted": fundo verde bem claro e texto verde escuro (7,5:1), no lugar de uma borda grossa.
  outline: {
    background: colors.primaryTint,
    pressed: colors.primaryBorder,
    text: colors.primaryText,
  },
  ghost: {
    background: "transparent",
    pressed: colors.ghostPressed,
    text: colors.textMuted,
  },
  danger: {
    background: colors.danger,
    pressed: colors.dangerPressed,
    text: colors.primaryContrast,
  },
  // Tom âmbar do catálogo do produtor.
  amber: {
    background: colors.warningStrong,
    pressed: colors.warningText,
    text: colors.primaryContrast,
  },
  amberOutline: {
    background: colors.warningSoft,
    pressed: colors.warningBorder,
    text: colors.warningDark,
  },
};

const paddings: Record<Size, ViewStyle> = {
  sm: { minHeight: TOUCH_TARGET, paddingHorizontal: spacing.md },
  md: { minHeight: 50, paddingHorizontal: spacing.lg },
  lg: { minHeight: 56, paddingHorizontal: spacing.xl },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
}: ButtonProps) {
  const style = variants[variant];
  const isDisabled = disabled || isLoading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        paddings[size],
        {
          backgroundColor: pressed ? style.pressed : style.background,
          borderColor: style.border,
          borderWidth: style.border ? 2 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
    >
      {isLoading && <ActivityIndicator color={style.text} size="small" />}
      <Text style={[styles.label, { color: style.text }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  label: typography.button,
});
