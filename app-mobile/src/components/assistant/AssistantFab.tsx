import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { usePresence } from "@/components/motion/usePresence";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/produtor/tabBar";
import { useAssistant } from "@/hooks/useAssistant";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { fabActionsFor, hasTabBar, type FabActionId, type ScreenId } from "@/lib/assistant/fabActions";
import { colors, radius, spacing } from "@/theme";
import { FabActionPill } from "./FabActionPill";

const SIZE = 60;
const EDGE = spacing.md;
// Quanto do botão aparece quando ele está escondido na lateral (o resto sai da tela).
const PEEK = 30;
const TUCK_OFFSET = SIZE + EDGE - PEEK;

interface AssistantFabProps {
  screen: ScreenId;
  onAction: (id: FabActionId) => void;
}

// Botão redondo no canto inferior direito: abre as opções da tela atual e pode ser escondido na lateral.
export function AssistantFab({ screen, onAction }: AssistantFabProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { tucked, setTucked, lift } = useAssistant();
  const keyboardVisible = useKeyboardVisible();
  const [expanded, setExpanded] = useState(false);
  const menu = usePresence(expanded);
  const tuck = usePresence(tucked, 240);
  const liftValue = useRef(new Animated.Value(0)).current;

  // As opções mudam de tela para tela, então o botão fecha ao navegar.
  useEffect(() => {
    setExpanded(false);
  }, [screen]);

  // Sobe e desce suavemente quando uma barra fixa (ex.: "Salvar Escolhas") aparece ou some.
  useEffect(() => {
    const animation = Animated.timing(liftValue, {
      toValue: -lift,
      duration: reduced ? 0 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [lift, reduced, liftValue]);

  // Com o teclado aberto o botão só atrapalharia a digitação.
  if (keyboardVisible) return null;

  const bottom = insets.bottom + (hasTabBar(screen) ? TAB_BAR_CONTENT_HEIGHT : 0) + EDGE;
  const actions = fabActionsFor(screen);

  function run(id: FabActionId) {
    setExpanded(false);
    onAction(id);
  }

  function hide() {
    setExpanded(false);
    setTucked(true);
  }

  function pressMain() {
    if (tucked) setTucked(false);
    else setExpanded((current) => !current);
  }

  const icon = tucked ? "chevron-back" : expanded ? "close" : "chatbubble-ellipses";
  const label = tucked ? "Mostrar botão de ajuda" : expanded ? "Fechar opções" : "Abrir ajuda e atalhos";

  return (
    <View style={styles.overlay}>
      {menu.mounted && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: menu.progress }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar opções"
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={() => setExpanded(false)}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.anchor,
          {
            right: EDGE,
            bottom,
            transform: [
              { translateX: tuck.progress.interpolate({ inputRange: [0, 1], outputRange: [0, TUCK_OFFSET] }) },
              { translateY: liftValue },
            ],
          },
        ]}
      >
        {menu.mounted && (
          <Animated.View
            style={[
              styles.menu,
              {
                opacity: menu.progress,
                transform: [{ translateY: menu.progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              },
            ]}
          >
            <FabActionPill label="Esconder botão" icon="eye-off-outline" tone="muted" onPress={hide} />
            {actions.map((action) => (
              <FabActionPill key={action.id} label={action.label} icon={action.icon} onPress={() => run(action.id)} />
            ))}
          </Animated.View>
        )}

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={label}
          aria-expanded={tucked ? undefined : expanded}
          onPress={pressMain}
          style={[styles.main, tucked && styles.mainTucked]}
        >
          <Ionicons name={icon} size={tucked ? 22 : 28} color={colors.primaryContrast} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Cobre a tela inteira, mas só o botão e as opções recebem toques.
  // O corte (overflow) evita que o botão escondido na lateral alargue a página no navegador.
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "box-none" },
  scrim: { backgroundColor: "rgba(17, 24, 39, 0.4)" },
  anchor: { position: "absolute", alignItems: "flex-end", gap: spacing.sm + 4 },
  menu: { alignItems: "flex-end", gap: spacing.sm + 4 },
  main: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    boxShadow: "0px 4px 14px rgba(22, 101, 52, 0.45)",
  },
  // Escondido, só a borda do botão aparece: a setinha vai para esse lado para ser vista.
  mainTucked: { justifyContent: "flex-start", paddingLeft: 4 },
});
