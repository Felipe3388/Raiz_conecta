import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

// Faz algo aparecer e sumir com animação: `mounted` diz se ainda deve existir na tela
// (some só depois da animação de saída) e `progress` vai de 0 (fora) a 1 (dentro).
export function usePresence(visible: boolean, duration = 220) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, reduced, duration, progress]);

  return { mounted, progress };
}
