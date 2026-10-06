import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  // Distância (em px) de onde o conteúdo "sobe" até o lugar.
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

// Entrada suave: o conteúdo aparece e sobe um pouco, em vez de surgir de repente.
export function Reveal({ children, delay = 0, offset = 18, style }: RevealProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
