import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { usePresence } from "@/components/motion/usePresence";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/produtor/tabBar";
import { useAssistant } from "@/hooks/useAssistant";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useUndo } from "@/hooks/useUndo";
import { fabActionsFor, hasTabBar, type FabActionId, type ScreenId } from "@/lib/assistant/fabActions";
import {
  dragPoint,
  flipSide,
  liftShift,
  menuDirection,
  restPoint,
  snapPlacement,
  type FabLayout,
} from "@/lib/assistant/fabPlacement";
import { colors, elevation, radius, spacing } from "@/theme";
import { FabActionPill } from "./FabActionPill";

const SIZE = 60;
const EDGE = spacing.md;
// Quanto do botão aparece quando ele está escondido na lateral (o resto sai da tela).
const PEEK = 30;
// A setinha do botão escondido: um pouco maior que a antiga, centralizada na parte que aparece.
const TUCKED_ICON = 28;
const TUCKED_PADDING = (PEEK - TUCKED_ICON) / 2;
// Quanto o dedo precisa andar para contar como arrastar (e não como um toque).
const DRAG_THRESHOLD = 6;
const MENU_GAP = spacing.sm + 4;
// Altura de uma opção do menu (círculo + espaço), para decidir se ele abre para cima ou para baixo.
const MENU_ITEM_HEIGHT = 52 + MENU_GAP;
// "Esconder botão" e "Mudar de lado" são opções fixas do menu, além das da tela.
const FIXED_MENU_ITEMS = 2;
const MOVE_MS = 240;
const ICON_TURN_MS = 260;
// Escondido na lateral o botão fica meio transparente, até alguém tocar nele.
const TUCKED_OPACITY = 0.55;
// No navegador com mouse, soltar o botão com o cursor ainda em cima dele gera um clique logo depois do arrastar.
// Esse clique não é um toque de verdade e é ignorado por este tempo.
const CLICK_AFTER_DRAG_MS = 250;

interface AssistantFabProps {
  screen: ScreenId;
  onAction: (id: FabActionId) => void;
}

// Botão redondo de ajuda. Dá para arrastá-lo para qualquer ponto da tela (ele gruda na lateral mais perto, como o
// AssistiveTouch do iPhone) e escondê-lo na lateral, onde a abinha também pode ser arrastada.
export function AssistantFab({ screen, onAction }: AssistantFabProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { tucked, setTucked, lift, placement, setPlacement } = useAssistant();
  const { entries } = useUndo();
  const keyboardVisible = useKeyboardVisible();
  const [expanded, setExpanded] = useState(false);
  // Muda a cada arrastada solta, para o botão voltar a se acomodar mesmo se o lugar final for o mesmo.
  const [settle, setSettle] = useState(0);
  const menu = usePresence(expanded);
  // O "+" gira um quarto de volta e vira "x" ao abrir; ao fechar, volta a ser "+".
  const rotation = useRef(new Animated.Value(0)).current;
  const turn = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });
  useEffect(() => {
    const animation = Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: reduced ? 0 : ICON_TURN_MS,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, reduced, rotation]);

  const layout = useMemo<FabLayout>(
    () => ({
      width,
      height,
      size: SIZE,
      edge: EDGE,
      peek: PEEK,
      top: insets.top + EDGE,
      bottom: insets.bottom + (hasTabBar(screen) ? TAB_BAR_CONTENT_HEIGHT : 0) + EDGE,
    }),
    [width, height, insets.top, insets.bottom, screen],
  );

  const rest = restPoint(placement, layout, tucked);
  // Uma barra fixa no fim da tela (ex.: "Salvar Escolhas") empurra o botão para cima, se ele estiver por perto.
  const targetY = rest.y - liftShift(rest.y, layout, lift);

  const x = useRef(new Animated.Value(rest.x)).current;
  const y = useRef(new Animated.Value(targetY)).current;
  const current = useRef({ x: rest.x, y: targetY });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  // O que o dedo já andou até o arrastar "pegar": o PanResponder zera a conta nesse momento.
  const grabbed = useRef({ x: 0, y: 0 });
  const droppedAt = useRef(0);
  // O arrastar é criado uma vez só; este ref dá a ele sempre as medidas mais novas.
  const latest = useRef({ layout, closeMenu: () => {}, save: setPlacement, hide: () => {} });
  latest.current = { layout, closeMenu: () => setExpanded(false), save: setPlacement, hide: () => setTucked(true) };

  useEffect(() => {
    const idX = x.addListener(({ value }) => (current.current.x = value));
    const idY = y.addListener(({ value }) => (current.current.y = value));
    return () => {
      x.removeListener(idX);
      y.removeListener(idY);
    };
  }, [x, y]);

  // Leva o botão ao lugar de repouso: ao soltar, ao esconder ou mostrar, ao subir por uma barra e ao girar a tela.
  useEffect(() => {
    if (dragging.current) return;
    const animation = Animated.parallel(
      [x, y].map((value, index) =>
        Animated.timing(value, {
          toValue: index === 0 ? rest.x : targetY,
          duration: reduced ? 0 : MOVE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [rest.x, targetY, settle, reduced, x, y]);

  const drag = useMemo(
    () =>
      PanResponder.create({
        // Só vira arrastar depois de o dedo andar um pouco; antes disso é um toque normal no botão.
        onMoveShouldSetPanResponderCapture: (_event, gesture) => {
          const isDrag = Math.hypot(gesture.dx, gesture.dy) > DRAG_THRESHOLD;
          if (isDrag) grabbed.current = { x: gesture.dx, y: gesture.dy };
          return isDrag;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragging.current = true;
          x.stopAnimation();
          y.stopAnimation();
          dragStart.current = { ...current.current };
          latest.current.closeMenu();
        },
        onPanResponderMove: (_event, gesture) => {
          const point = dragPoint(
            dragStart.current,
            grabbed.current,
            { x: gesture.dx, y: gesture.dy },
            latest.current.layout,
          );
          x.setValue(point.x);
          y.setValue(point.y);
        },
        onPanResponderRelease: () => finishDrag(),
        onPanResponderTerminate: () => finishDrag(),
      }),
    [],
  );

  function finishDrag() {
    dragging.current = false;
    droppedAt.current = Date.now();
    latest.current.save(snapPlacement({ ...current.current }, latest.current.layout));
    // Arrastou e soltou: o botão se esconde sozinho na lateral mais perto, sem precisar escolher "Esconder botão".
    latest.current.hide();
    setSettle((count) => count + 1);
  }

  // As opções mudam de tela para tela, então o botão fecha ao navegar.
  useEffect(() => {
    setExpanded(false);
  }, [screen]);

  // Com o teclado aberto o botão só atrapalharia a digitação.
  if (keyboardVisible) return null;

  const actions = fabActionsFor(screen, entries.length > 0);
  const direction = menuDirection(layout, targetY, actions.length + FIXED_MENU_ITEMS, MENU_ITEM_HEIGHT);
  const onLeft = placement.side === "left";

  function run(id: FabActionId) {
    setExpanded(false);
    onAction(id);
  }

  function hide() {
    setExpanded(false);
    setTucked(true);
  }

  function flip() {
    setExpanded(false);
    setPlacement(flipSide(placement));
  }

  function pressMain() {
    if (Date.now() - droppedAt.current < CLICK_AFTER_DRAG_MS) return;
    if (tucked) setTucked(false);
    else setExpanded((open) => !open);
  }

  // A ordem vai de longe a perto do botão: a Ajuda fica sempre colada nele, abrindo para cima ou para baixo.
  const items = [
    <FabActionPill
      key="hide"
      label="Esconder botão"
      icon="eye-off-outline"
      tone="muted"
      side={placement.side}
      onPress={hide}
    />,
    <FabActionPill
      key="flip"
      label="Mudar de lado"
      icon="swap-horizontal-outline"
      tone="muted"
      side={placement.side}
      onPress={flip}
    />,
    ...actions.map((action) => (
      <FabActionPill
        key={action.id}
        label={action.label}
        icon={action.icon}
        side={placement.side}
        onPress={() => run(action.id)}
      />
    )),
  ];
  if (direction === "down") items.reverse();

  const tuckedIcon = onLeft ? "chevron-forward" : "chevron-back";
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

      <Animated.View style={[styles.anchor, { transform: [{ translateX: x }, { translateY: y }] }]}>
        {menu.mounted && (
          <Animated.View
            style={[
              styles.menu,
              direction === "up" ? { bottom: SIZE + MENU_GAP } : { top: SIZE + MENU_GAP },
              onLeft ? styles.menuLeft : styles.menuRight,
              {
                // Sem largura própria o menu ficaria do tamanho do botão (60) e as opções com texto longo
                // vazariam para fora da tela. Assim ele ocupa a largura útil, colado no lado do botão.
                width: width - EDGE * 2,
                opacity: menu.progress,
                transform: [
                  {
                    translateY: menu.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [direction === "up" ? 14 : -14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {items}
          </Animated.View>
        )}

        <View {...drag.panHandlers} style={[styles.handle, tucked && styles.handleTucked]}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Arraste para mudar o botão de lugar"
            aria-expanded={tucked ? undefined : expanded}
            onPress={pressMain}
            style={[styles.main, tucked && (onLeft ? styles.mainTuckedLeft : styles.mainTuckedRight)]}
          >
            {tucked ? (
              <Ionicons name={tuckedIcon} size={TUCKED_ICON} color={colors.primaryContrast} />
            ) : (
              <Animated.View style={{ transform: [{ rotate: turn }] }}>
                <Ionicons name="add" size={36} color={colors.primaryContrast} />
              </Animated.View>
            )}
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Cobre a tela inteira, mas só o botão e as opções recebem toques.
  // O corte evita que o botão escondido na lateral alargue a página no navegador. No navegador usa "clip" e não
  // "hidden": "hidden" ainda deixa o navegador rolar o conteúdo (ex.: ao focar o botão escondido), e o botão
  // sairia do lugar.
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: Platform.OS === "web" ? ("clip" as unknown as ViewStyle["overflow"]) : "hidden",
    pointerEvents: "box-none",
  },
  scrim: { backgroundColor: "rgba(17, 24, 39, 0.4)" },
  // O ponto (0, 0) do botão; quem o leva ao lugar certo é a animação de x e y.
  anchor: { position: "absolute", top: 0, left: 0, width: SIZE, height: SIZE },
  handle: { width: SIZE, height: SIZE },
  // Só as opções recebem toques; o espaço vazio ao lado delas deixa o toque passar para fechar o menu.
  menu: { position: "absolute", gap: MENU_GAP, pointerEvents: "box-none" },
  menuRight: { right: 0, alignItems: "flex-end" },
  menuLeft: { left: 0, alignItems: "flex-start" },
  main: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    boxShadow: elevation.raised,
  },
  handleTucked: { opacity: TUCKED_OPACITY },
  // Escondido, só metade do botão aparece (PEEK): a setinha fica no meio dessa parte, na horizontal e na vertical.
  // `row` é o que faz o justifyContent mexer na horizontal (na coluna ele a levaria para o alto do botão).
  mainTuckedRight: { flexDirection: "row", justifyContent: "flex-start", paddingLeft: TUCKED_PADDING },
  mainTuckedLeft: { flexDirection: "row", justifyContent: "flex-end", paddingRight: TUCKED_PADDING },
});
