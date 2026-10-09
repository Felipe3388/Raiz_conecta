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

// A balança do produtor. Hoje só existe a simulada (MockScaleService). O módulo de verdade será um ESP32 com célula
// de carga, e entra aqui sem mexer nas telas: ele só precisa mandar leituras em kg; saber se o peso "parou" é regra
// do app (lib/delivery/scale.ts), igual para qualquer balança.
export interface ScaleGateway {
  // Começa a receber leituras e devolve a função que para. `onConnection` avisa se a balança conectou ou caiu.
  subscribe(
    onReading: (reading: ScaleReading) => void,
    onConnection?: (connection: ScaleConnection) => void,
  ): () => void;
  // Presente só na balança simulada.
  readonly simulator?: ScaleSimulator;
}
