import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { positionFraction, valueFromPosition } from "@/lib/produtor/quantity";
import { colors, radius } from "@/theme";

const THUMB = 30;
const TRACK = 14;
const HEIGHT = 44;

interface QuantitySliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  // Lido por quem usa leitor de tela: "Ajustar quantidade de Tomate".
  label: string;
  // A cor do preenchimento e do botão (verde quando completo, âmbar quando parcial).
  color?: string;
}

// Barra para arrastar a quantidade, de 0 ao pedido: o preenchimento mostra quanto do pedido o produtor atende. Tocar
// em qualquer ponto da barra leva até ali; arrastar acompanha o dedo. Quantidades inteiras, como no campo de digitar.
export function QuantitySlider({ value, max, onChange, label, color = colors.primary }: QuantitySliderProps) {
  const [width, setWidth] = useState(0);
  // O arrastar é criado uma vez só; este ref dá a ele sempre as medidas e a função mais novas.
  const latest = useRef({ width, max, onChange });
  latest.current = { width, max, onChange };
  const startX = useRef(0);

  const pan = useMemo(() => {
    // O dedo segura o centro do botão, que anda só entre as pontas (largura menos o botão).
    const move = (x: number) =>
      latest.current.onChange(valueFromPosition(x - THUMB / 2, latest.current.width - THUMB, latest.current.max));
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        startX.current = event.nativeEvent.locationX;
        move(startX.current);
      },
      onPanResponderMove: (_event, gesture) => move(startX.current + gesture.dx),
    });
  }, []);

  const fraction = positionFraction(value, max);
  const travel = Math.max(width - THUMB, 0);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} de ${max}`}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === "increment" ? 1 : -1;
        onChange(Math.min(Math.max(value + step, 0), max));
      }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={styles.touch}
      {...pan.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={[styles.thumb, { left: fraction * travel, borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Área de toque alta (44), com a barra fina no meio. Os filhos não pegam o toque: quem recebe é sempre a área toda,
  // e a posição do dedo é relativa a ela.
  touch: { height: HEIGHT, justifyContent: "center", cursor: "pointer" as never },
  track: {
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: "hidden",
    pointerEvents: "none",
  },
  fill: { height: "100%", borderRadius: radius.full },
  thumb: {
    position: "absolute",
    top: (HEIGHT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    borderWidth: 3,
    backgroundColor: colors.surface,
    boxShadow: "0 1px 4px rgba(17, 24, 39, 0.25)",
    pointerEvents: "none",
  },
});
