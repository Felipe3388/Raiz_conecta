import { useCallback, useEffect, useRef } from "react";
import { HOLD_DELAY_MS, repeatInterval } from "@/lib/produtor/holdRepeat";

// Faz um botão repetir enquanto o dedo (ou o mouse) estiver nele. Um toque rápido dá um passo só;
// segurando, depois de um instante, os passos vêm sozinhos e cada vez mais rápidos.
// `onStep(tick)` devolve true para continuar repetindo e false quando não há mais para onde ir.
export function useHoldRepeat(onStep: (tick: number) => boolean, disabled = false) {
  const stepRef = useRef(onStep);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef(0);
  const held = useRef(false);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const schedule = useCallback(
    (delay: number) => {
      timer.current = setTimeout(() => {
        held.current = true;
        const keepGoing = stepRef.current(tick.current);
        tick.current += 1;
        if (keepGoing) schedule(repeatInterval(tick.current));
        else stop();
      }, delay);
    },
    [stop],
  );

  // Se o botão for desativado no meio (chegou no limite), a repetição para.
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  useEffect(() => stop, [stop]);

  return {
    onPressIn: () => {
      if (disabled) return;
      held.current = false;
      tick.current = 0;
      schedule(HOLD_DELAY_MS);
    },
    onPressOut: stop,
    // Ao soltar, o toque só conta como "um passo" se não houve repetição.
    onPress: () => {
      if (!held.current) stepRef.current(0);
      held.current = false;
    },
  };
}
