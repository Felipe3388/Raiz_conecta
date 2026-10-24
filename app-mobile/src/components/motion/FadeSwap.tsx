import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

const OUT_MS = 140;
const IN_MS = 260;
const HEIGHT_MS = 300;

function fadeIn(opacity: Animated.Value) {
  Animated.timing(opacity, {
    toValue: 1,
    duration: IN_MS,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start();
}

interface FadeSwapProps {
  // Muda quando o conteúdo passa a ser "outro" (ex.: de carga irregular para peso parado).
  swapKey: string;
  // Anima também a altura, para o que vem abaixo descer ou subir devagar em vez de pular.
  animateHeight?: boolean;
  children: ReactNode;
}

// Troca um conteúdo por outro sem corte: o antigo some, o novo aparece, e a altura acompanha. Enquanto a chave é a
// mesma o conteúdo se atualiza normalmente (uma contagem que muda a cada segundo, por exemplo).
export function FadeSwap({ swapKey, animateHeight = false, children }: FadeSwapProps) {
  const reduced = useReducedMotion();
  const [shownKey, setShownKey] = useState(swapKey);
  const lastShown = useRef<ReactNode>(children);
  const opacity = useRef(new Animated.Value(1)).current;
  const height = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState(false);

  if (shownKey === swapKey) lastShown.current = children;

  useEffect(() => {
    if (shownKey === swapKey) {
      // A chave voltou ao que já estava na tela no meio da troca: o conteúdo precisa terminar visível.
      opacity.stopAnimation((value) => {
        if (value < 1) fadeIn(opacity);
      });
      return;
    }
    if (reduced) {
      setShownKey(swapKey);
      return;
    }
    let settled = false;
    const out = Animated.timing(opacity, {
      toValue: 0,
      duration: OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    out.start(({ finished }) => {
      if (!finished) return;
      settled = true;
      setShownKey(swapKey);
      fadeIn(opacity);
    });
    // Só para a saída se ela ainda não terminou: `stop()` pararia também a entrada que já começou no mesmo valor.
    return () => {
      if (!settled) out.stop();
    };
  }, [swapKey, shownKey, reduced, opacity]);

  function onLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.height;
    if (!animateHeight) return;
    if (!measured) {
      height.setValue(next);
      setMeasured(true);
      return;
    }
    Animated.timing(height, {
      toValue: next,
      duration: reduced ? 0 : HEIGHT_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }

  const content = (
    <Animated.View style={{ opacity }}>{shownKey === swapKey ? children : lastShown.current}</Animated.View>
  );

  if (!animateHeight) return content;

  // Depois da primeira medida, o contêiner de fora manda na altura e o conteúdo fica solto dentro dele.
  return (
    <Animated.View style={measured ? [styles.wrap, styles.clip, { height }] : styles.wrap}>
      <View style={measured ? styles.loose : undefined} onLayout={onLayout}>
        {content}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch" },
  clip: { overflow: "hidden" },
  loose: { position: "absolute", top: 0, left: 0, right: 0 },
});
