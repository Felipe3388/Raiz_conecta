import { useFocusEffect } from "expo-router";
import { useCallback, useRef, type ReactNode } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import { createTransitionTracker, type AuthScreenName, type TransitionDirection } from "./screenTransition";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

const SLIDE_DISTANCE = 32;
const DURATION_MS = 320;

const tracker = createTransitionTracker();

const START_OFFSET: Record<TransitionDirection, number> = {
  forward: SLIDE_DISTANCE,
  back: -SLIDE_DISTANCE,
  none: 0,
};

interface ScreenTransitionProps {
  screen: AuthScreenName;
  children: ReactNode;
}

// Ao abrir a tela, o conteúdo desliza do lado certo: da direita ao avançar, da esquerda ao voltar.
// No celular quem anima é a pilha nativa; aqui só o navegador precisa disso.
export function ScreenTransition({ screen, children }: ScreenTransitionProps) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const direction = tracker.enter(screen);
      if (Platform.OS !== "web" || reduced || direction === "none") {
        opacity.setValue(1);
        slide.setValue(0);
        return;
      }

      opacity.setValue(0);
      slide.setValue(START_OFFSET[direction]);
      const timing = {
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      };
      const animation = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, ...timing }),
        Animated.timing(slide, { toValue: 0, ...timing }),
      ]);
      animation.start();
      return () => animation.stop();
    }, [screen, reduced, opacity, slide]),
  );

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateX: slide }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // overflow evita barra de rolagem horizontal enquanto o conteúdo desliza.
  container: { flex: 1, overflow: "hidden" },
});
