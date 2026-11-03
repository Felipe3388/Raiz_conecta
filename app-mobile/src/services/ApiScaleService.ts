import type { ApiClient } from "@/lib/http/ApiClient";
import { normalizeDeviceId } from "@/lib/delivery/scaleLink";
import type { ScaleConnection, ScaleGateway, ScaleReading, SubscribeOptions } from "./ScaleGateway";

// O que GET /api/produtor/balancas/{id}/leitura devolve.
interface LiveReadingDto {
  online: boolean;
  kg: number | null;
  estavel: boolean;
  // Quando o servidor recebeu a última leitura (ms) e a hora do servidor agora.
  em: number | null;
  agora: number;
}

interface Options {
  // De quanto em quanto tempo o app consulta o servidor enquanto a balança está no ar.
  intervalMs?: number;
  // Espera maior quando a balança caiu ou não há conexão com o servidor.
  offlineIntervalMs?: number;
}

// A balança de verdade: o módulo ESP32 manda o peso ao servidor e o app consulta a última leitura (polling). Só entrega
// uma leitura nova quando o servidor recebeu outra (campo `em` mudou): consultar duas vezes a mesma leitura não pode contar
// como duas amostras na regra de "o peso parou" (lib/delivery/scale.ts).
export class ApiScaleService implements ScaleGateway {
  private readonly intervalMs: number;
  private readonly offlineIntervalMs: number;

  constructor(
    private readonly api: Pick<ApiClient, "get">,
    { intervalMs = 500, offlineIntervalMs = 2000 }: Options = {},
  ) {
    this.intervalMs = intervalMs;
    this.offlineIntervalMs = offlineIntervalMs;
  }

  subscribe(
    onReading: (reading: ScaleReading) => void,
    onConnection?: (connection: ScaleConnection) => void,
    options?: SubscribeOptions,
  ): () => void {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastAt: number | null = null;
    let connection: ScaleConnection | null = null;

    const report = (next: ScaleConnection) => {
      if (next === connection) return;
      connection = next;
      onConnection?.(next);
    };

    report("connecting");
    const deviceId = options?.deviceId;
    // Sem balança conectada não há o que consultar: a tela mostra "balança desconectada" e deixa digitar o peso.
    if (!deviceId) {
      report("lost");
      return () => {};
    }
    const path = `/api/produtor/balancas/${normalizeDeviceId(deviceId)}/leitura`;

    const poll = async () => {
      let delay = this.intervalMs;
      try {
        const reading = await this.api.get<LiveReadingDto>(path);
        if (stopped) return;
        if (reading.online && typeof reading.kg === "number" && Number.isFinite(reading.kg)) {
          report("connected");
          const at = reading.em ?? reading.agora;
          if (at !== lastAt) {
            lastAt = at;
            onReading({ kg: reading.kg, at });
          }
        } else {
          report("lost");
          lastAt = null;
          delay = this.offlineIntervalMs;
        }
      } catch {
        if (stopped) return;
        report("lost");
        lastAt = null;
        delay = this.offlineIntervalMs;
      }
      if (!stopped) timer = setTimeout(poll, delay);
    };
    void poll();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }
}
