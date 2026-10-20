import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { groupOrders, type Order } from "@/lib/delivery/orders";
import { pendingCount } from "@/lib/delivery/plan";
import { nextDeliveryDays } from "@/lib/delivery/schedule";
import { getDeliveryService, type DeliveryGateway } from "@/services";
import type { Delivery, WeighingInput } from "@/types/delivery";
import { useProdutorData } from "./useProdutorData";

type LoadStatus = "loading" | "ready" | "error";

interface DeliveriesData {
  status: LoadStatus;
  deliveries: Delivery[];
  // As entregas agrupadas por mercado e dia: é como o produtor as vê.
  orders: Order[];
  // Quantos pedidos pedem ação do produtor até o próximo dia de entrega: é o número da aba Entregas.
  pending: number;
  // O próximo dia de entrega (terça ou sexta), no formato "2026-10-16".
  nextDay: string;
  // Só no modo simulado dá para fazer de conta que o mercado pesou.
  canSimulateReceipt: boolean;
  addWeighing: (deliveryId: string, input: WeighingInput) => Promise<void>;
  removeWeighing: (deliveryId: string, weighingId: string) => Promise<void>;
  // Entrega à logística todos os produtos de um pedido, um depois do outro.
  handOverAll: (deliveryIds: string[]) => Promise<void>;
  simulateReceipt: (deliveryId: string, input: WeighingInput) => Promise<void>;
  reload: () => Promise<void>;
}

const DeliveriesContext = createContext<DeliveriesData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  deliveries?: DeliveryGateway;
}

// Entregas da área do Produtor. Fica dentro de ProdutorDataProvider porque cada proposta aceita vira uma entrega:
// aceitar uma proposta muda esta lista.
export function DeliveriesProvider({ email, children, deliveries: gateway = getDeliveryService() }: ProviderProps) {
  const { status: dataStatus, proposals } = useProdutorData();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [list, setList] = useState<Delivery[]>([]);
  const loadedOnce = useRef(false);

  // `quiet`: atualiza a lista sem trocar a tela por um carregando (e sem erro se falhar; fica a lista de antes).
  const load = useCallback(
    async (quiet: boolean) => {
      if (!quiet) setStatus("loading");
      try {
        setList(await gateway.listDeliveries(email));
        loadedOnce.current = true;
        setStatus("ready");
      } catch {
        if (!quiet) setStatus("error");
      }
    },
    [gateway, email],
  );

  useEffect(() => {
    if (dataStatus === "ready") void load(loadedOnce.current);
  }, [dataStatus, proposals, load]);

  const reload = useCallback(() => load(false), [load]);

  const replace = useCallback((updated: Delivery) => {
    setList((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const addWeighing = useCallback(
    async (deliveryId: string, input: WeighingInput) => replace(await gateway.addWeighing(email, deliveryId, input)),
    [gateway, email, replace],
  );

  const removeWeighing = useCallback(
    async (deliveryId: string, weighingId: string) =>
      replace(await gateway.removeWeighing(email, deliveryId, weighingId)),
    [gateway, email, replace],
  );

  const handOverAll = useCallback(
    async (deliveryIds: string[]) => {
      for (const deliveryId of deliveryIds) replace(await gateway.handOver(email, deliveryId));
    },
    [gateway, email, replace],
  );

  const simulateReceipt = useCallback(
    async (deliveryId: string, input: WeighingInput) => {
      if (!gateway.simulateReceipt) throw new Error("O recebimento do mercado não pode ser simulado aqui.");
      replace(await gateway.simulateReceipt(email, deliveryId, input));
    },
    [gateway, email, replace],
  );

  const value = useMemo<DeliveriesData>(() => {
    const orders = groupOrders(list);
    const today = new Date();
    return {
      status: dataStatus === "error" ? "error" : status,
      deliveries: list,
      orders,
      pending: status === "ready" ? pendingCount(orders, today) : 0,
      nextDay: nextDeliveryDays(today, 1)[0],
      canSimulateReceipt: gateway.simulateReceipt !== undefined,
      addWeighing,
      removeWeighing,
      handOverAll,
      simulateReceipt,
      reload,
    };
  }, [dataStatus, status, list, gateway, addWeighing, removeWeighing, handOverAll, simulateReceipt, reload]);

  return <DeliveriesContext.Provider value={value}>{children}</DeliveriesContext.Provider>;
}

export function useDeliveries(): DeliveriesData {
  const context = useContext(DeliveriesContext);
  if (!context) throw new Error("useDeliveries deve ser usado dentro de DeliveriesProvider.");
  return context;
}
