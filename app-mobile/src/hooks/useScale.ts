import { useEffect, useRef, useState } from "react";
import { readingSpread, STABLE_SAMPLES, stableReading, type ReadingSpread } from "@/lib/delivery/scale";
import { getScaleService, type ScaleConnection, type ScaleGateway } from "@/services";

// Guarda mais leituras do que as olhadas pela regra, para ela sempre ter as últimas.
const KEPT_SAMPLES = STABLE_SAMPLES * 4;

interface ScaleState {
  // A leitura mais recente, mesmo oscilando.
  kg: number;
  // O peso quando as últimas leituras assentaram; null enquanto oscila ou a balança está vazia.
  stableKg: number | null;
  connection: ScaleConnection;
  // O quanto as últimas leituras estão oscilando (para avisar de uma carga irregular).
  spread: ReadingSpread;
}

const IDLE: ScaleState = { kg: 0, stableKg: null, connection: "connecting", spread: readingSpread([]) };

// Escuta a balança enquanto `active` for verdadeiro. A decisão de "o peso parou" é da regra do app
// (lib/delivery/scale.ts), igual para a balança simulada e para a de verdade.
export function useScale(active: boolean, scale: ScaleGateway = getScaleService()) {
  const [state, setState] = useState<ScaleState>(IDLE);
  const samples = useRef<number[]>([]);

  useEffect(() => {
    if (!active) return;
    samples.current = [];
    const stop = scale.subscribe(
      (reading) => {
        samples.current = [...samples.current, reading.kg].slice(-KEPT_SAMPLES);
        setState((current) => ({
          ...current,
          kg: reading.kg,
          stableKg: stableReading(samples.current),
          spread: readingSpread(samples.current),
        }));
      },
      (connection) => setState((current) => ({ ...current, connection })),
    );
    return () => {
      stop();
      setState(IDLE);
    };
  }, [active, scale]);

  return { ...state, simulator: scale.simulator };
}
