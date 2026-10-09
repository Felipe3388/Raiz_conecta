import { useMemo, useState } from "react";
import { describeDelivery, type DeliveryCard } from "@/lib/delivery/card";
import { buildPickList, dayChips, DONE_FILTER, filterDeliveries } from "@/lib/delivery/plan";
import { dayKey } from "@/lib/delivery/schedule";
import { judgeWeight, toleranceFor } from "@/lib/delivery/weight";
import { formatKg } from "@/lib/format/weight";
import type { WeighingInput } from "@/types/delivery";
import { useDeliveries } from "./useDeliveries";
import { useToast } from "./useToast";
import type { WeigherRole } from "./useWeighSheet";

interface WeighTarget {
  id: string;
  role: WeigherRole;
}

// Controller da aba Entregas: o dia escolhido, o que separar, os pedidos e as janelas de pesar e entregar.
export function useEntregasScreen() {
  const data = useDeliveries();
  const toast = useToast();
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [target, setTarget] = useState<WeighTarget | null>(null);
  const [handOverId, setHandOverId] = useState<string | null>(null);
  const [isHandingOver, setIsHandingOver] = useState(false);

  // "Hoje" vale até a lista mudar; abrir o app em outro dia recomeça tudo mesmo.
  const today = useMemo(() => new Date(), [data.deliveries]);
  const chips = useMemo(() => dayChips(data.deliveries, today), [data.deliveries, today]);
  // Se o dia escolhido deixou de existir (ex.: a última entrega dele foi concluída), volta para hoje.
  const filter = chosenDay !== null && chips.some((chip) => chip.id === chosenDay) ? chosenDay : dayKey(today);

  const visible = useMemo(() => filterDeliveries(data.deliveries, filter, today), [data.deliveries, filter, today]);
  const cards = useMemo(() => visible.map((delivery) => describeDelivery(delivery, today)), [visible, today]);
  const pickList = useMemo(() => (filter === DONE_FILTER ? [] : buildPickList(visible)), [visible, filter]);

  const byId = (id: string | null): DeliveryCard | null => {
    const delivery = id === null ? undefined : data.deliveries.find((item) => item.id === id);
    return delivery ? describeDelivery(delivery, today) : null;
  };

  async function register(input: WeighingInput) {
    if (!target) return;
    const card = byId(target.id);
    if (target.role === "PRODUTOR") {
      await data.addWeighing(target.id, input);
      return;
    }

    await data.simulateReceipt(target.id, input);
    setTarget(null);
    if (card) {
      const verdict = judgeWeight(card.expectedKg, input.kg, toleranceFor(card.delivery.produto)).verdict;
      if (verdict === "NA_FAIXA") toast.show("success", "Recebida!", `O mercado pesou ${formatKg(input.kg)}.`);
      else toast.show("warning", "Divergência no recebimento", `O mercado pesou ${formatKg(input.kg)}.`);
    }
  }

  async function removeWeighing(weighingId: string) {
    if (!target) return;
    try {
      await data.removeWeighing(target.id, weighingId);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    }
  }

  async function confirmHandOver() {
    if (handOverId === null) return;
    setIsHandingOver(true);
    try {
      await data.handOver(handOverId);
      setHandOverId(null);
      toast.show("success", "Entregue à logística!", "O mercado vai conferir o peso ao receber.");
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
    // A janela de pesar: a entrega aberta (sempre a versão mais nova) e quem está pesando.
    weigh: {
      card: byId(target?.id ?? null),
      role: target?.role ?? "PRODUTOR",
      open: (id: string, role: WeigherRole = "PRODUTOR") => setTarget({ id, role }),
      close: () => setTarget(null),
      register,
      remove: removeWeighing,
    },
    handOver: {
      card: byId(handOverId),
      isLoading: isHandingOver,
      ask: setHandOverId,
      cancel: () => setHandOverId(null),
      confirm: confirmHandOver,
    },
  };
}
