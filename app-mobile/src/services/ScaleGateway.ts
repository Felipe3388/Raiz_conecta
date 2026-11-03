// Uma leitura da balança, em kg, e o instante em que chegou (milissegundos).
export interface ScaleReading {
  kg: number;
  at: number;
}

export type ScaleConnection = "connecting" | "connected" | "lost";

// Só existe na balança simulada: serve para "colocar produto" nela, como o produtor faria na de verdade.
export interface ScaleSimulator {
  place(kg: number): void;
  clear(): void;
}

export interface SubscribeOptions {
  // A balança conectada do produtor. A simulada ignora; a real (ApiScaleService) consulta o servidor por ela.
  deviceId?: string | null;
}

// A balança do produtor: a simulada (MockScaleService) ou a real (ApiScaleService: módulo ESP32 com célula de carga que
// manda o peso ao servidor, e o app consulta). Ela só precisa entregar leituras em kg; saber se o peso "parou" é regra
// do app (lib/delivery/scale.ts), igual para qualquer balança.
export interface ScaleGateway {
  // Começa a receber leituras e devolve a função que para. `onConnection` avisa se a balança conectou ou caiu.
  subscribe(
    onReading: (reading: ScaleReading) => void,
    onConnection?: (connection: ScaleConnection) => void,
    options?: SubscribeOptions,
  ): () => void;
  // Presente só na balança simulada.
  readonly simulator?: ScaleSimulator;
}
