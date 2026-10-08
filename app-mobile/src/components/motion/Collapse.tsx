import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

interface CollapseProps {
  visible: boolean;
  children: ReactNode;
  // Atraso só na entrada, para vários itens aparecerem em sequência.
  delay?: number;
  duration?: number;
}

// Abre e fecha o conteúdo com animação de altura e transparência, para o que vem abaixo descer e subir
// suavemente em vez de dar um salto. Depois de fechar, não ocupa nenhum espaço.
// A altura não funciona com o driver nativo, por isso esta animação roda no JavaScript (é leve).
export function Collapse({ visible, children, delay = 0, duration = 240 }: CollapseProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : duration,
      delay: reduced || !visible ? 0 : delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, reduced, delay, duration, progress]);

  // `visible` já basta para desenhar: não espera o estado `mounted` atualizar (evita um quadro vazio na entrada).
  if (!mounted && !visible) return null;

  return (
    <Animated.View
      style={[
        styles.clip,
        { opacity: progress, height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }) },
      ]}
    >
      {/* Fica solto no topo só para ser medido; quem manda na altura visível é o contêiner acima. */}
      <View style={styles.content} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  content: { position: "absolute", top: 0, left: 0, right: 0 },
});
