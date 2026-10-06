import { useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { USE_NATIVE_DRIVER } from "./timing";

interface PressableScaleProps extends Omit<PressableProps, "style" | "children"> {
  children: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
  // Estilo visual (fundo, borda, espaçamento): é o que encolhe ao tocar.
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  // Estilo do contêiner externo (ex.: flex: 1 dentro de uma linha).
  containerStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

// Pressable que "afunda" um pouquinho ao toque e volta com mola: dá a sensação de botão de verdade.
export function PressableScale({
  children,
  style,
  containerStyle,
  pressedScale = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(event) => {
        animateTo(pressedScale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
    >
      {(state) => (
        <Animated.View
          style={[typeof style === "function" ? style(state) : style, { transform: [{ scale }] }]}
        >
          {typeof children === "function" ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
