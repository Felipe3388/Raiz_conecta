import { useMemo, useState } from "react";
import { describeOrder, type OrderCard } from "@/lib/delivery/orderCard";
import { firstItemToWeigh, nextItemToWeigh, previousItem } from "@/lib/delivery/orderFlow";
import { buildPickList, dayChips, DONE_FILTER, filterOrders } from "@/lib/delivery/plan";
import { judgeWeight, toleranceFor } from "@/lib/delivery/weight";
import { formatKg } from "@/lib/format/weight";
import type { WeigherRole, WeighingInput } from "@/types/delivery";
import { useDeliveries } from "./useDeliveries";
import { useToast } from "./useToast";

// A pesagem em andamento: de qual pedido, quem pesa e em qual produto do pedido está.
interface WeighSession {
  orderKey: string;
  role: WeigherRole;
  itemId: string;
}

// Controller da aba Entregas: o dia escolhido, o que separar no total, os pedidos de cada mercado e as janelas de
// pesar (produto a produto) e de entregar o pedido à logística.
export function useEntregasScreen() {
  const data = useDeliveries();
  const toast = useToast();
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [session, setSession] = useState<WeighSession | null>(null);
  const [handOverKey, setHandOverKey] = useState<string | null>(null);
  const [isHandingOver, setIsHandingOver] = useState(false);

  // "Hoje" vale até a lista mudar; abrir o app em outro dia recomeça tudo mesmo.
  const today = useMemo(() => new Date(), [data.deliveries]);
  const chips = useMemo(() => dayChips(data.orders, today), [data.orders, today]);
  // Se o dia escolhido deixou de existir (ex.: o último pedido dele foi concluído), volta para o primeiro dia.
  const filter = chosenDay !== null && chips.some((chip) => chip.id === chosenDay) ? chosenDay : chips[0].id;

  const visible = useMemo(() => filterOrders(data.orders, filter, today), [data.orders, filter, today]);
  const cards = useMemo(() => visible.map((order) => describeOrder(order, today)), [visible, today]);
  // O total a separar no dia, somando os pedidos de todos os mercados.
  const pickList = useMemo(
    () => (filter === DONE_FILTER ? [] : buildPickList(visible.flatMap((order) => order.items))),
    [visible, filter],
  );

  const cardByKey = (key: string | null): OrderCard | null => {
    const order = key === null ? undefined : data.orders.find((item) => item.key === key);
    return order ? describeOrder(order, today) : null;
  };

  const sessionOrder = cardByKey(session?.orderKey ?? null);
  const sessionItems = sessionOrder?.items ?? [];
  const currentItem = sessionItems.find((item) => item.delivery.id === session?.itemId) ?? null;

  function openWeighing(orderKey: string, role: WeigherRole = "PRODUTOR") {
    const order = cardByKey(orderKey);
    if (order) setSession({ orderKey, role, itemId: firstItemToWeigh(order.items, role) });
  }

  function goTo(itemId: string | null) {
    if (itemId !== null) setSession((current) => (current ? { ...current, itemId } : current));
  }

  function finishProducerWeighing(order: OrderCard) {
    setSession(null);
    const outside = order.outOfRange.length;
    if (order.weighedItems < order.itemCount) {
      toast.show("warning", "Faltam produtos para pesar", `${order.weighedItems} de ${order.itemCount} pesados.`);
    } else if (outside > 0) {
      toast.show("warning", "Pesagem concluída com diferença", `${outside} produto(s) fora da faixa aceita.`);
    } else {
      toast.show("success", "Pesagem concluída!", `${order.itemCount} produto(s) de ${order.mercado} prontos.`);
    }
  }

  // Do produto atual, vai ao seguinte; depois do último, a pesagem do pedido termina.
  function next() {
    if (!session || !sessionOrder) return;
    const following = nextItemToWeigh(sessionOrder.items, session.itemId, "PRODUTOR");
    if (following === null) finishProducerWeighing(sessionOrder);
    else goTo(following);
  }

  async function register(input: WeighingInput) {
    if (!session || !sessionOrder || !currentItem) return;
    if (session.role === "PRODUTOR") {
      await data.addWeighing(session.itemId, input);
      return;
    }

    // O mercado pesa cada produto uma vez; depois vai direto ao próximo que falta.
    await data.simulateReceipt(session.itemId, input);
    const following = nextItemToWeigh(sessionOrder.items, session.itemId, "MERCADO");
    if (following !== null) {
      goTo(following);
      return;
    }

    setSession(null);
    const verdict = judgeWeight(currentItem.expectedKg, input.kg, toleranceFor(currentItem.delivery.produto)).verdict;
    const divergent =
      sessionOrder.divergent.filter((item) => item.delivery.id !== session.itemId).length +
      (verdict === "NA_FAIXA" ? 0 : 1);
    if (divergent === 0)
      toast.show("success", "Pedido recebido!", `O mercado conferiu ${formatKg(input.kg)} no último produto.`);
    else toast.show("warning", "Divergência no recebimento", `${divergent} produto(s) com o peso fora da faixa.`);
  }

  async function removeWeighing(weighingId: string) {
    if (!session) return;
    try {
      await data.removeWeighing(session.itemId, weighingId);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    }
  }

  async function confirmHandOver() {
    const order = cardByKey(handOverKey);
    if (!order) return;
    setIsHandingOver(true);
    try {
      await data.handOverAll(order.items.map((item) => item.delivery.id));
      setHandOverKey(null);
      toast.show("success", "Pedido entregue à logística!", "O mercado vai conferir o peso ao receber.");
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsHandingOver(false);
    }
  }

  return {
    status: data.status,
    reload: data.reload,
    chips,
    filter,
    chooseDay: setChosenDay,
    cards,
    pickList,
    total: data.deliveries.length,
    canSimulateReceipt: data.canSimulateReceipt,
    // A janela de pesar: o pedido, o produto da vez (sempre a versão mais nova) e quem está pesando.
    weigh: {
      order: sessionOrder,
      card: currentItem,
      role: session?.role ?? "PRODUTOR",
      position: currentItem ? sessionItems.indexOf(currentItem) : 0,
      isLast: currentItem !== null && currentItem === sessionItems[sessionItems.length - 1],
      open: openWeighing,
      close: () => setSession(null),
      goTo: (itemId: string) => goTo(itemId),
      previous: () => session && goTo(previousItem(sessionItems, session.itemId)),
      next,
      register,
      remove: removeWeighing,
    },
    handOver: {
      card: cardByKey(handOverKey),
      isLoading: isHandingOver,
      ask: setHandOverKey,
      cancel: () => setHandOverKey(null),
      confirm: confirmHandOver,
    },
  };
}
