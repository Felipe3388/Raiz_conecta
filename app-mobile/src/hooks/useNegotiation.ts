import { useEffect, useRef, useState } from "react";
import {
  answerProposal,
  currentProposal,
  pauseSecondsLeft,
  reconsiderLast,
  REFUSAL_PAUSE_MS,
  startNegotiation,
  visibleRounds,
  type NegotiationInput,
} from "@/lib/pricing/negotiation";
import type { PriceResponse } from "@/services";

// A proposta recusada e até quando a próxima demora a chegar.
interface Pause {
  refusedPrice: number;
  until: number;
}

const TICK_MS = 250;

// Controller da negociação (leilão inverso): o produtor vê uma proposta de cada vez e responde aceito ou recuso.
// Depois de recusar, a próxima só chega depois de uma pausa; nela ele pode voltar atrás e aceitar a que recusou.
// Cada resposta é avisada (é o que a plataforma usa para ajustar o preço sugerido), mas uma recusa só vale quando a
// pausa acaba: quem volta atrás nela fica só com a aceitação.
export function useNegotiation(
  initial: NegotiationInput,
  produto: string,
  onAnswer?: (response: PriceResponse) => void,
  pauseMs: number = REFUSAL_PAUSE_MS,
) {
  const [state, setState] = useState(() => startNegotiation(initial));
  const [pause, setPause] = useState<Pause | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const proposal = pause === null ? currentProposal(state) : null;

  // As funções mudam a cada tela desenhada; o relógio da pausa usa sempre a mais nova.
  const latest = useRef({ onAnswer, produto });
  latest.current = { onAnswer, produto };

  useEffect(() => {
    if (pause === null) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      if (current < pause.until) {
        setNow(current);
        return;
      }
      // A pausa acabou: a recusa vale e a próxima proposta chega.
      latest.current.onAnswer?.({ produto: latest.current.produto, price: pause.refusedPrice, answer: "rejected" });
      setPause(null);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [pause]);

  function accept() {
    if (proposal === null) return;
    setState((current) => answerProposal(current, "accepted"));
    onAnswer?.({ produto, price: proposal, answer: "accepted" });
  }

  function reject() {
    if (proposal === null) return;
    const next = answerProposal(state, "rejected");
    setState(next);
    if (next.outcome === "open") {
      setPause({ refusedPrice: proposal, until: Date.now() + pauseMs });
    } else {
      // Foi a última, ou a próxima já chega ao preço do produtor: não há o que esperar.
      onAnswer?.({ produto, price: proposal, answer: "rejected" });
    }
  }

  // "Mudei de ideia": aceita o preço que acabou de recusar, ainda na pausa.
  function takeBack() {
    if (pause === null) return;
    setState((current) => reconsiderLast(current));
    onAnswer?.({ produto, price: pause.refusedPrice, answer: "accepted" });
    setPause(null);
  }

  return {
    state,
    // A proposta que está na mesa; null durante a pausa e quando terminou.
    proposal,
    // As propostas que o produtor já viu (as futuras ficam escondidas).
    seen: visibleRounds(state, pause === null),
    step: state.answers.length + 1,
    isLast: proposal !== null && state.answers.length === state.rounds.length - 1,
    pause:
      pause === null
        ? null
        : { refusedPrice: pause.refusedPrice, secondsLeft: Math.max(1, pauseSecondsLeft(pause.until, now)) },
    accept,
    reject,
    takeBack,
    restart: (next: NegotiationInput) => {
      setPause(null);
      setState(startNegotiation(next));
    },
  };
}

export type NegotiationController = ReturnType<typeof useNegotiation>;
