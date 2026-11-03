"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/http/client";
import { normalizeDeviceId } from "@/lib/iot/deviceId";
import { applyReading, INITIAL_LIVE_WEIGHT, type LiveReadingDto, type LiveWeight } from "@/lib/iot/liveWeight";

// O peso da balança conectada, ao vivo. Só pergunta com a aba visível (aba escondida não gasta rede nem bateria)
// e para de perguntar ao sair da tela ou trocar de balança.
export function useLiveWeight(deviceId: string | null): LiveWeight {
  const [weight, setWeight] = useState<LiveWeight>(INITIAL_LIVE_WEIGHT);

  useEffect(() => {
    if (!deviceId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = `/api/produtor/balancas/${normalizeDeviceId(deviceId)}/leitura`;

    async function poll() {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        timer = setTimeout(poll, 1000);
        return;
      }
      const result = await api<LiveReadingDto>(url, { cache: "no-store" });
      if (stopped) return;
      const { weight: next, nextInMs } = applyReading(result.ok ? result.data : null);
      setWeight(next);
      timer = setTimeout(poll, nextInMs);
    }

    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      setWeight(INITIAL_LIVE_WEIGHT);
    };
  }, [deviceId]);

  return weight;
}
