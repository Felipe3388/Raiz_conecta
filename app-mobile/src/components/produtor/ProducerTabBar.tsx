import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "@/components/brand/BrandMark";
import { PressableScale } from "@/components/motion/PressableScale";
import { useFocusAnimation } from "@/components/motion/useFocusAnimation";
import { splitTabs, visibleTabs } from "@/lib/produtor/tabs";
import { colors, elevation, radius, typography } from "@/theme";
import { TabBarItem } from "./TabBarItem";
import {
  HOME_BUTTON_RAISE,
  HOME_BUTTON_SIZE,
  HOME_SLOT_WIDTH,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_MAX_WIDTH,
  TAB_LABEL_MAX_FONT_SCALE,
} from "./tabBar";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const HOME_LABEL = "Início";

// Barra de abas do Produtor: as abas repartidas dos dois lados e, no meio, um botão redondo, um pouco acima das
// demais, que leva ao Painel (a tela inicial). Cada lado ocupa metade da barra, para o botão ficar sempre no centro. A área transparente em cima da barra é onde o botão sobe:
// o toque só chega a um botão que está dentro da área do seu pai.
export function ProducerTabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const split = splitTabs(visibleTabs(state.routes.map((route) => route.name)));
  const routeOf = (name: string) => state.routes.find((route) => route.name === name);
  const focusedName = state.routes[state.index]?.name;

  function press(name: string) {
    const route = routeOf(name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (focusedName !== name && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  }

  function renderTab(name: string) {
    const route = routeOf(name);
    if (!route) return null;
    const options = descriptors[route.key].options;
    const focused = focusedName === name;
    const title = options.title ?? name;

    return (
      <TabBarItem
        key={route.key}
        title={title}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
        focused={focused}
        badge={options.tabBarBadge}
        onPress={() => press(name)}
        renderIcon={(color) => options.tabBarIcon?.({ focused, color, size: 26 })}
      />
    );
  }

  const homeFocused = split.home !== null && focusedName === split.home;
  const homeFocus = useFocusAnimation(homeFocused);
  const homeLift = { transform: [{ scale: homeFocus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] };

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.root, { height: HOME_BUTTON_RAISE + TAB_BAR_CONTENT_HEIGHT + insets.bottom }]}
    >
      <View style={[styles.bar, { height: TAB_BAR_CONTENT_HEIGHT + insets.bottom, paddingBottom: insets.bottom + 6 }]}>
        <View style={styles.row}>
          <View style={styles.half}>{split.left.map(renderTab)}</View>
          <View style={styles.homeSlot}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE}
              style={[styles.label, { color: homeFocused ? colors.primary : colors.textMuted }]}
            >
              {HOME_LABEL}
            </Text>
          </View>
          <View style={styles.half}>{split.right.map(renderTab)}</View>
        </View>
      </View>

      {split.home !== null && (
        <View style={styles.homeWrap}>
          <Animated.View style={homeLift}>
            <PressableScale
              accessibilityRole="tab"
              aria-selected={homeFocused}
              accessibilityLabel={HOME_LABEL}
              accessibilityHint="Abre o painel, a tela inicial"
              onPress={() => press(split.home as string)}
              style={[styles.home, homeFocused ? styles.homeOn : styles.homeOff]}
            >
              <BrandMark size={36} color={homeFocused ? colors.primaryContrast : colors.primary} />
            </PressableScale>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // O fundo é o da tela: a faixa de cima (onde o botão sobe) se mistura com ela.
  root: { backgroundColor: colors.background },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: TAB_BAR_MAX_WIDTH,
    alignSelf: "center",
  },
  half: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
  label: { ...typography.caption, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  homeSlot: { width: HOME_SLOT_WIDTH, alignSelf: "stretch", alignItems: "center", justifyContent: "flex-end" },
  // Linha no topo, centralizada: o botão fica no meio da largura, um pouco acima da barra.
  homeWrap: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", pointerEvents: "box-none" },
  home: {
    width: HOME_BUTTON_SIZE,
    height: HOME_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 3,
    boxShadow: elevation.raised,
  },
  homeOn: { backgroundColor: colors.primary, borderColor: colors.surface },
  homeOff: { backgroundColor: colors.surface, borderColor: colors.surface },
});
