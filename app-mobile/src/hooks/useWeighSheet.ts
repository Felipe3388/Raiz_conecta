import { useEffect, useRef, useState } from "react";
import { formatKg } from "@/lib/format/weight";
import { WEIGH_ERRORS } from "@/content/deliveryTexts";
import { keepLocked, scaleStatus } from "@/lib/delivery/scale";
import { deliveryExpectedKg, totalWeighedKg } from "@/lib/delivery/stage";
import { judgeWeight, parseKg, roundKg, toleranceFor } from "@/lib/delivery/weight";
import { minimumAlert, type MinimumAlert } from "@/content/deliveryTexts";
import type { Delivery, WeigherRole, WeighingInput, WeighingSource } from "@/types/delivery";
import { useScale } from "./useScale";

interface Options {
  visible: boolean;
  delivery: Delivery | null;
  role: WeigherRole;
  onRegister: (input: WeighingInput) => Promise<void>;
  // Na sessão de pesagem o produtor passa de um produto a outro sem esvaziar a balança entre eles: a folha mantém a
  // trava do último peso (a balança precisa esvaziar antes do próximo) em vez de recomeçar.
  keepScaleBetweenItems?: boolean;
}

// Controller da folha de pesagem: lê a balança (ou o peso digitado), compara com o esperado e registra o lote.
// O produtor pesa em vários lotes, que se somam; o mercado pesa a entrega toda de uma vez.
export function useWeighSheet({ visible, delivery, role, onRegister, keepScaleBetweenItems = false }: Options) {
  const [source, setSource] = useState<WeighingSource>("BALANCA");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Depois de registrar um lote, a balança precisa esvaziar antes do próximo (o mesmo lote não conta duas vezes).
  const [locked, setLocked] = useState(false);
  const scale = useScale(visible && source === "BALANCA");

  // Cada vez que a folha abre, ou que se passa para outro produto do pedido, recomeça limpa, com a balança vazia.
  const deliveryId = delivery?.id ?? null;
  const wasVisible = useRef(false);
  useEffect(() => {
    const continuing = keepScaleBetweenItems && wasVisible.current;
    wasVisible.current = visible;
    if (!visible) return;
    setSource("BALANCA");
    setText("");
    setError(null);
    if (!continuing) {
      setLocked(false);
      scale.simulator?.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir ou trocar de produto
  }, [visible, deliveryId]);

  useEffect(() => {
    setLocked((current) => keepLocked(current, scale.kg));
  }, [scale.kg]);

  const candidate = source === "BALANCA" ? (locked ? null : scale.stableKg) : parseKg(text);
  const already = role === "PRODUTOR" && delivery ? totalWeighedKg(delivery) : 0;
  const projectedKg = roundKg(already + (candidate ?? 0));
  const expectedKg = delivery ? deliveryExpectedKg(delivery) : 0;
  const tolerance = toleranceFor(delivery?.produto ?? "");
  // A mesma faixa para os dois lados (±2%): abaixo do mínimo não fecha o produto e acima do máximo não é aceito.
  const judgement = judgeWeight(expectedKg, projectedKg > 0 ? projectedKg : null, tolerance);
  // Aviso "abaixo do mínimo": enquanto aberto, o produtor continua no mesmo produto.
  const [alert, setAlert] = useState<MinimumAlert | null>(null);

  // Para sair do produto: barra o que ficou abaixo do mínimo e abre o aviso. Devolve true quando pode seguir.
  function allow(totalKg: number): boolean {
    if (role !== "PRODUTOR" || !delivery) return true;
    const result = judgeWeight(expectedKg, totalKg > 0 ? totalKg : null, tolerance);
    if (result.verdict === "NA_FAIXA" || result.verdict === "ACIMA") return true;
    setAlert(minimumAlert(delivery.produto, result));
    return false;
  }

  async function register() {
    if (candidate === null) {
      setError(source === "BALANCA" ? WEIGH_ERRORS.nothing : WEIGH_ERRORS.manual);
      return;
    }
    // O produtor não registra abaixo do mínimo nem acima do pedido (999 kg num pedido de 10 kg, por exemplo).
    if (role === "PRODUTOR" && judgement.verdict === "ACIMA") {
      setError(WEIGH_ERRORS.above(formatKg(judgement.range.maxKg)));
      return;
    }
    if (role === "PRODUTOR" && judgement.verdict === "ABAIXO") {
      setError(WEIGH_ERRORS.below(formatKg(judgement.range.minKg)));
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onRegister({ kg: candidate, source });
      if (source === "BALANCA") setLocked(true);
      else setText("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  }

  // Antes de ir ao próximo produto: o que já foi registrado precisa ter chegado ao mínimo.
  function canLeave(): boolean {
    // Enquanto o último peso ainda está sendo salvo, espera: um novo toque segue.
    if (isSaving) return false;
    return allow(already);
  }

  function changeSource(next: WeighingSource) {
    setSource(next);
    setError(null);
  }

  function changeText(value: string) {
    setText(value);
    setError(null);
  }

  return {
    source,
    changeSource,
    text,
    changeText,
    error,
    isSaving,
    register,
    alert,
    dismissAlert: () => setAlert(null),
    canLeave,
    candidate,
    projectedKg,
    expectedKg,
    judgement,
    scale: {
      kg: scale.kg,
      stableKg: scale.stableKg,
      spread: scale.spread,
      simulator: scale.simulator,
      status: scaleStatus({ connection: scale.connection, kg: scale.kg, stableKg: scale.stableKg, locked }),
    },
  };
}
