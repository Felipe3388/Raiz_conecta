import { useCallback, useEffect, useRef, useState } from "react";
import { holdTick, STABLE_HOLD_SECONDS } from "@/lib/delivery/scale";
import type { OrderCard } from "@/lib/delivery/orderCard";
import {
  advanceRun,
  backRun,
  BETWEEN_ORDERS_SECONDS,
  betweenInfo,
  buildRunSteps,
  CELEBRATION_MS,
  CELEBRATION_SWAP_MS,
  celebrationKind,
  celebrationNext,
  runPosition,
  shouldAutoRegister,
  skipNextOrder,
  startRun,
  type RunState,
} from "@/lib/delivery/session";
import { betweenPrompt, getSpeaker, RUN_FINISHED_PROMPT, weighPrompt } from "@/lib/speech";
import { CELEBRATION_TEXTS, RUN_TEXTS } from "@/content/deliveryTexts";
import { formatKg } from "@/lib/format/weight";
import type { WeighingInput } from "@/types/delivery";
import { useDeliveries } from "./useDeliveries";
import { useSettings } from "./useSettings";
import { useToast } from "./useToast";
import { useWeighSheet } from "./useWeighSheet";

interface Options {
  // Os pedidos do dia escolhido, já descritos para a tela; a sessão pesa o que neles ainda pede pesagem.
  cards: OrderCard[];
}

// A confirmação verde que aparece ao passar de produto ou de pedido (ver CELEBRATION_MS em lib/delivery/session).
export interface Celebration {
  // Muda a cada confirmação, para a animação recomeçar mesmo quando o texto é parecido.
  id: number;
  kind: "item" | "order";
  title: string;
  detail: string;
  // "Em seguida: ...", ou null quando é a última.
  next: string;
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
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // As funções dos temporizadores rodam 1,5 a 3 s depois: precisam ver os pedidos e o modo de agora, não os de quando
  // foram criadas.
  const latest = useRef({ cards, auto, muted });
  latest.current = { cards, auto, muted };
  const celebrating = celebration !== null;

  const steps = buildRunSteps(cards);
  const step = run ? run.steps[run.index] : undefined;
  // Sempre a versão mais nova do pedido e do produto (os pesos registrados mudam a cada passo).
  const order = step ? (cards.find((card) => card.key === step.orderKey) ?? null) : null;
  const card = order?.items.find((item) => item.delivery.id === step?.itemId) ?? null;
  const position = run ? runPosition(run.steps, run.index) : null;
  const between = run ? betweenInfo(run) : null;

  function finish(state: RunState) {
    const { cards, muted } = latest.current;
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

  function advance(state: RunState) {
    const following = advanceRun(state, latest.current.auto);
    if (following) setRun(following);
    else finish(state);
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  // Seguir adiante com a confirmação verde: ela aparece por 3 s e o passo troca por baixo dela no meio desse tempo,
  // então o próximo produto nunca surge de repente. Na pausa entre pedidos não há confirmação e segue direto.
  // `itemKg` é o peso do produto da vez já com o lote que acabou de ser registrado.
  function advanceWithCelebration(state: RunState, itemKg: number) {
    const kind = celebrationKind(state, latest.current.auto);
    if (!kind) return advance(state);

    const { cards } = latest.current;
    const current = state.steps[state.index];
    const orderCard = cards.find((entry) => entry.key === current?.orderKey) ?? null;
    const itemCard = orderCard?.items.find((entry) => entry.delivery.id === current?.itemId) ?? null;
    const next = celebrationNext(state, kind);
    const orderKg = orderCard ? orderCard.weighedKg - (itemCard?.weighedKg ?? 0) + itemKg : itemKg;

    celebrationId.current += 1;
    setCelebration(
      kind === "item"
        ? {
            id: celebrationId.current,
            kind,
            title: CELEBRATION_TEXTS.itemTitle(current?.produto ?? ""),
            detail: CELEBRATION_TEXTS.itemDetail(formatKg(itemKg)),
            next: next ? CELEBRATION_TEXTS.nextProduct(next.produto) : CELEBRATION_TEXTS.nextConfirm,
          }
        : {
            id: celebrationId.current,
            kind,
            title: CELEBRATION_TEXTS.orderTitle(current?.mercado ?? ""),
            detail: CELEBRATION_TEXTS.orderDetail(
              orderCard?.itemCount ?? 1,
              formatKg(state.phase === "confirm" ? (orderCard?.weighedKg ?? orderKg) : orderKg),
            ),
            next: next ? CELEBRATION_TEXTS.nextOrder(next.mercado) : CELEBRATION_TEXTS.lastOrder,
          },
    );

    // Se é o fim da sessão, a tela só fecha depois da confirmação inteira.
    const last = advanceRun(state, latest.current.auto) === null;
    clearTimers();
    timers.current = [
      setTimeout(() => advance(state), last ? CELEBRATION_MS : CELEBRATION_SWAP_MS),
      setTimeout(() => setCelebration(null), CELEBRATION_MS),
    ];
  }

  // Ao sair da tela os temporizadores não podem mexer em nada.
  useEffect(() => clearTimers, []);

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

  // O peso estável precisa ficar parado por 5 segundos (contador na tela) antes de poder ser registrado. Se voltar a
  // oscilar, a contagem recomeça. Só vale para o peso da balança (o digitado não oscila).
  const { candidate, judgement, source, isSaving } = sheet;
  const stable = run?.phase === "weigh" && source === "BALANCA" && candidate !== null && !celebrating;
  const [holdLeft, setHoldLeft] = useState(STABLE_HOLD_SECONDS);
  useEffect(() => {
    setHoldLeft(STABLE_HOLD_SECONDS);
    if (!stable) return;
    const timer = setInterval(() => setHoldLeft((left) => holdTick(left, true)), 1000);
    return () => clearInterval(timer);
  }, [stable]);
  const held = stable && holdLeft <= 0;

  // Modo automático: peso parado por 5 s e dentro da faixa → registra, mostra a confirmação e segue, sem toque na tela.
  useEffect(() => {
    if (!run || run.phase !== "weigh" || autoBusy.current || celebrating) return;
    if (
      !shouldAutoRegister({
        autoWeigh: auto,
        source,
        candidateKg: candidate,
        verdict: judgement.verdict,
        saving: isSaving,
        held,
      })
    )
      return;

    autoBusy.current = true;
    const itemKg = sheet.projectedKg;
    void sheet.register().then(() => {
      autoBusy.current = false;
      advanceWithCelebration(run, itemKg);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage ao peso, ao passo, ao modo e à contagem
  }, [run, auto, source, candidate, judgement.verdict, isSaving, held, celebrating]);

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

  // Pausa entre pedidos: conta de 5 até 0 e, no zero, começa sozinha o pedido seguinte. A conta só anda depois da
  // confirmação verde de "pedido fechado" sair da tela.
  const inBetween = between !== null;
  const counting = inBetween && !celebrating;
  useEffect(() => {
    if (inBetween) setSeconds(BETWEEN_ORDERS_SECONDS);
  }, [inBetween, run?.index, run?.skipped]);

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSeconds((left) => left - 1), 1000);
    return () => clearInterval(timer);
  }, [counting, run?.index, run?.skipped]);

  useEffect(() => {
    if (counting && seconds <= 0 && run) advance(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando a contagem chega ao zero
  }, [seconds, counting]);

  function start() {
    const initial = startRun(steps);
    if (!initial) return;
    autoBusy.current = false;
    setRun(initial);
  }

  function close() {
    getSpeaker().stop();
    clearTimers();
    setCelebration(null);
    setRun(null);
  }

  function toggleMuted() {
    if (!muted) getSpeaker().stop();
    void update({ voice: muted });
  }

  // Na pausa: deixa o próximo pedido para depois (ele continua pendente em Entregas) e segue para o outro, se houver.
  function skipNext() {
    if (!run || celebrating) return;
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
    // O que a balança está fazendo agora: a contagem de 5 s do peso parado e se ele já ficou firme.
    stability: { secondsLeft: holdLeft, stable, held, spread: sheet.scale.spread },
    // A confirmação verde na tela (null quando não há).
    celebration,
    // Do produto da vez para o seguinte (ou para a confirmação do pedido, no modo manual), com a confirmação verde.
    // Só segue se o produto já chegou ao mínimo; senão abre o aviso e fica no mesmo item.
    next: () => {
      if (!run || celebrating) return;
      if (run.phase === "weigh" && !sheet.canLeave()) return;
      advanceWithCelebration(run, card?.weighedKg ?? 0);
    },
    previous: () => run && !celebrating && setRun(backRun(run)),
    // Manual: confirma o pedido (com a confirmação verde de pedido fechado) e segue para o próximo.
    confirmOrder: () => run && !celebrating && advanceWithCelebration(run, 0),
  };
}
