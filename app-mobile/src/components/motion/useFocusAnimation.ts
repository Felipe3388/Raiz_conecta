import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

// Valor animado de 0 (parado) a 1 (em foco), com mola. Sem animação para quem pediu "reduzir movimento".
export function useFocusAnimation(focused: boolean): Animated.Value {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const toValue = focused ? 1 : 0;
    if (reduced) {
      value.setValue(toValue);
      return;
    }
    const animation = Animated.spring(value, { toValue, speed: 18, bounciness: 9, useNativeDriver: USE_NATIVE_DRIVER });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, value]);

  return value;
}
