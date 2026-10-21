import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderCard } from "@/lib/delivery/orderCard";
import {
  advanceRun,
  backRun,
  BETWEEN_ORDERS_SECONDS,
  betweenInfo,
  buildRunSteps,
  runPosition,
  shouldAutoRegister,
  skipNextOrder,
  startRun,
  type RunState,
} from "@/lib/delivery/session";
import { betweenPrompt, getSpeaker, RUN_FINISHED_PROMPT, weighPrompt } from "@/lib/speech";
import { RUN_TEXTS } from "@/content/deliveryTexts";
import type { WeighingInput } from "@/types/delivery";
import { useDeliveries } from "./useDeliveries";
import { useSettings } from "./useSettings";
import { useToast } from "./useToast";
import { useWeighSheet } from "./useWeighSheet";

interface Options {
  // Os pedidos do dia escolhido, já descritos para a tela; a sessão pesa o que neles ainda pede pesagem.
  cards: OrderCard[];
}

// Controller da sessão de pesagem (o botão "Iniciar pesagem"): passa por todos os produtos do dia, um por vez, com o
// mercado no topo e a voz dizendo o que pesar. Automático (padrão): registra sozinho quando o peso estabiliza dentro da
// faixa e segue para o próximo. Manual: o produtor registra cada produto e confirma cada pedido antes de seguir.
export function useWeighRun({ cards }: Options) {
  const data = useDeliveries();
  const toast = useToast();
  const { settings, update } = useSettings();
  const auto = settings.autoWeigh;
  // A voz fica como o produtor deixou da última vez (guardada nas configurações).
  const muted = !settings.voice;
  const [run, setRun] = useState<RunState | null>(null);
  const [seconds, setSeconds] = useState(BETWEEN_ORDERS_SECONDS);
  const autoBusy = useRef(false);

  const steps = buildRunSteps(cards);
  const step = run ? run.steps[run.index] : undefined;
  // Sempre a versão mais nova do pedido e do produto (os pesos registrados mudam a cada passo).
  const order = step ? (cards.find((card) => card.key === step.orderKey) ?? null) : null;
  const card = order?.items.find((item) => item.delivery.id === step?.itemId) ?? null;
  const position = run ? runPosition(run.steps, run.index) : null;
  const between = run ? betweenInfo(run) : null;

  function finish(state: RunState) {
    const done = cards.filter((item) => state.steps.some((entry) => entry.orderKey === item.key));
    const outside = done.reduce((sum, item) => sum + item.outOfRange.length, 0);
    const items = done.reduce((sum, item) => sum + item.weighedItems, 0);
    setRun(null);
    if (!muted) getSpeaker().say(RUN_FINISHED_PROMPT);
    const later = state.skipped > 0 ? ` ${RUN_TEXTS.skippedNote(state.skipped)}` : "";
    if (outside > 0)
      toast.show("warning", "Pesagem concluída com diferença", `${outside} produto(s) fora da faixa aceita.${later}`);
    else
      toast.show("success", "Pesagem concluída!", `${items} produto(s) em ${done.length} pedido(s) prontos.${later}`);
  }

  const advance = useCallback(
    (state: RunState) => {
      const following = advanceRun(state, auto);
      if (following) setRun(following);
      else finish(state);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `finish` só lê `cards`, que muda a cada registro
    [auto, cards],
  );

  const register = useCallback(
    async (input: WeighingInput) => {
      if (step) await data.addWeighing(step.itemId, input);
    },
    [data, step],
  );

  const sheet = useWeighSheet({
    visible: run !== null,
    delivery: card?.delivery ?? null,
    role: "PRODUTOR",
    onRegister: register,
    keepScaleBetweenItems: true,
  });

  // Modo automático: peso parado e dentro da faixa → registra e segue, sem toque na tela.
  const { candidate, judgement, source, isSaving } = sheet;
  useEffect(() => {
    if (!run || run.phase !== "weigh" || autoBusy.current) return;
    if (
      !shouldAutoRegister({
        autoWeigh: auto,
        source,
        candidateKg: candidate,
        verdict: judgement.verdict,
        saving: isSaving,
      })
    )
      return;

    autoBusy.current = true;
    void sheet.register().then(() => {
      autoBusy.current = false;
      advance(run);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage ao peso, ao passo e ao modo
  }, [run, auto, source, candidate, judgement.verdict, isSaving]);

  // A voz diz o que pesar e de qual mercado a cada produto novo, e na pausa entre pedidos avisa o próximo.
  const speakerOn = run !== null && !muted;
  useEffect(() => {
    if (!speakerOn) return;
    if (between) {
      getSpeaker().say(betweenPrompt(between.finishedMercado, between.nextMercado, BETWEEN_ORDERS_SECONDS));
      return;
    }
    if (!step || !card || run?.phase !== "weigh") return;
    getSpeaker().say(weighPrompt({ mercado: step.mercado, produto: step.produto, expectedKg: card.expectedKg }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fala quando muda o produto, a fase, a pausa ou o mudo
  }, [speakerOn, run?.index, run?.phase, run?.skipped]);

  // Pausa entre pedidos: conta de 5 até 0 e, no zero, começa sozinha o pedido seguinte.
  const inBetween = between !== null;
  useEffect(() => {
    if (!inBetween) return;
    setSeconds(BETWEEN_ORDERS_SECONDS);
    const timer = setInterval(() => setSeconds((left) => left - 1), 1000);
    return () => clearInterval(timer);
  }, [inBetween, run?.index, run?.skipped]);

  useEffect(() => {
    if (inBetween && seconds <= 0 && run) advance(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando a contagem chega ao zero
  }, [seconds, inBetween]);

  function start() {
    const initial = startRun(steps);
    if (!initial) return;
    autoBusy.current = false;
    setRun(initial);
  }

  function close() {
    getSpeaker().stop();
    setRun(null);
  }

  function toggleMuted() {
    if (!muted) getSpeaker().stop();
    void update({ voice: muted });
  }

  // Na pausa: deixa o próximo pedido para depois (ele continua pendente em Entregas) e segue para o outro, se houver.
  function skipNext() {
    if (!run) return;
    const following = skipNextOrder(run);
    if (betweenInfo(following)) setRun(following);
    else finish(following);
  }

  return {
    // Dá para começar: há algo a pesar nos pedidos do dia.
    canStart: steps.length > 0,
    isOpen: run !== null,
    isAuto: auto,
    phase: run?.phase ?? "weigh",
    order,
    card,
    position,
    sheet,
    muted,
    // Pausa entre pedidos: o pedido que acabou, o próximo e a contagem regressiva (null fora da pausa).
    between: between ? { ...between, seconds: Math.max(seconds, 0) } : null,
    skipNext,
    start,
    close,
    toggleMuted,
    // Do produto da vez para o seguinte (ou para a confirmação do pedido, no modo manual).
    next: () => run && advance(run),
    previous: () => run && setRun(backRun(run)),
    // Manual: confirma o pedido e segue para o próximo.
    confirmOrder: () => run && advance(run),
  };
}
