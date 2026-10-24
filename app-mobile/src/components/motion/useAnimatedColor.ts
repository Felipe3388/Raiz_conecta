import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

const DEFAULT_MS = 360;

// Muda de uma cor para outra aos poucos em vez de trocar de repente (botão que vai de verde a laranja, fundo que muda de
// tom). Devolve o valor para usar em backgroundColor / borderColor / color de um componente Animated. Sem animação para
// quem pediu "reduzir movimento".
export function useAnimatedColor(color: string, duration = DEFAULT_MS) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const [pair, setPair] = useState({ from: color, to: color });

  useEffect(() => {
    if (pair.to === color) return;
    setPair({ from: pair.to, to: color });
    progress.setValue(reduced ? 1 : 0);
    if (reduced) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando a cor de destino muda
  }, [color]);

  return progress.interpolate({ inputRange: [0, 1], outputRange: [pair.from, pair.to] });
}
