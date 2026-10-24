import type { ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusAnimation } from "@/components/motion/useFocusAnimation";
import { colors, radius, typography } from "@/theme";
import { TAB_LABEL_MAX_FONT_SCALE } from "./tabBar";

interface TabBarItemProps {
  title: string;
  accessibilityLabel: string;
  focused: boolean;
  badge?: string | number;
  onPress: () => void;
  // Recebe a cor do ícone (verde em foco, cinza parado).
  renderIcon: (color: string) => ReactNode;
}

// Um botão da barra de abas: uma pílula verde clara abre atrás do ícone e o ícone dá um pulinho quando a aba é
// aberta; ao sair, tudo volta suave. O rótulo fica verde na aba aberta.
export function TabBarItem({ title, accessibilityLabel, focused, badge, onPress, renderIcon }: TabBarItemProps) {
  const focus = useFocusAnimation(focused);
  const color = focused ? colors.primary : colors.textMuted;

  const pill = {
    opacity: focus,
    transform: [{ scaleX: focus.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
  };
  const icon = { transform: [{ translateY: focus.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }] };

  return (
    <Pressable
      accessibilityRole="tab"
      aria-selected={focused}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.tab}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.pill, pill]} />
        <Animated.View style={icon}>{renderIcon(color)}</Animated.View>
        {badge !== undefined && badge !== "" && (
          <View style={styles.badge}>
            <Text maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE} style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE} style={[styles.label, { color }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: "center", gap: 2, paddingTop: 2, paddingBottom: 2, minHeight: 44 },
  iconSlot: { width: 56, height: 32, alignItems: "center", justifyContent: "center" },
  pill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
  },
  label: { ...typography.caption, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  badge: {
    position: "absolute",
    top: -2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.danger,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.primaryContrast },
});
