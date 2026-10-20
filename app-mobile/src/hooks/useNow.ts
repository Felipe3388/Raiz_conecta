import { useEffect, useState } from "react";

// A hora de agora, atualizada a cada `intervalMs` enquanto `active` for verdadeiro (contagens regressivas).
// Parada, não gasta bateria: a hora só muda quando alguma coisa na tela precisa dela.
export function useNow(active: boolean, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return now;
}
