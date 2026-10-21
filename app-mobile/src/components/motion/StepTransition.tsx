import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";
import { useReducedMotion } from "./useReducedMotion";

const OUT_MS = 140;
const IN_MS = 280;
const OUT_OFFSET = -16;
const IN_OFFSET = 24;

interface StepTransitionProps {
  // Muda quando o conteúdo passa para "outro passo" (outro produto, outro pedido, a pausa...).
  stepKey: string;
  children: ReactNode;
}

// Troca de passo sem corte seco: o passo que sai some deslizando um pouco para a esquerda e o novo entra vindo da
// direita. Enquanto o passo é o mesmo, o conteúdo se atualiza normalmente (a leitura da balança continua ao vivo).
// Sem animação para quem pediu "reduzir movimento".
export function StepTransition({ stepKey, children }: StepTransitionProps) {
  const reduced = useReducedMotion();
  const [shownKey, setShownKey] = useState(stepKey);
  const lastShown = useRef<ReactNode>(children);
  const opacity = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  if (shownKey === stepKey) lastShown.current = children;

  useEffect(() => {
    if (shownKey === stepKey) return;
    if (reduced) {
      setShownKey(stepKey);
      return;
    }

    let cancelled = false;
    const options = { useNativeDriver: USE_NATIVE_DRIVER };
    const out = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: OUT_MS, easing: Easing.in(Easing.quad), ...options }),
      Animated.timing(slide, { toValue: OUT_OFFSET, duration: OUT_MS, easing: Easing.in(Easing.quad), ...options }),
    ]);
    out.start(({ finished }) => {
      if (cancelled || !finished) return;
      setShownKey(stepKey);
      slide.setValue(IN_OFFSET);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: IN_MS, easing: Easing.out(Easing.cubic), ...options }),
        Animated.timing(slide, { toValue: 0, duration: IN_MS, easing: Easing.out(Easing.cubic), ...options }),
      ]).start();
    });
    return () => {
      cancelled = true;
      out.stop();
    };
  }, [stepKey, shownKey, reduced, opacity, slide]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slide }] }}>
      {shownKey === stepKey ? children : lastShown.current}
    </Animated.View>
  );
}
