import { ApiScaleService } from "./ApiScaleService";

const ID = "A4:CF:12:9B:07:E1";
const reading = (over: Partial<{ online: boolean; kg: number | null; estavel: boolean; em: number | null; agora: number }> = {}) => ({
  online: true, kg: 10.5, estavel: true, em: 1000, agora: 1100, ...over,
});

// Deixa as promessas e os timers pendentes andarem.
async function flush(ms = 0) {
  await jest.advanceTimersByTimeAsync(ms);
}

describe("ApiScaleService", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function setup(responses: unknown[]) {
    const get = jest.fn();
    responses.forEach((response) => (response instanceof Error ? get.mockRejectedValueOnce(response) : get.mockResolvedValueOnce(response)));
    get.mockResolvedValue(responses.at(-1) instanceof Error ? reading() : responses.at(-1));
    const onReading = jest.fn();
    const onConnection = jest.fn();
    const service = new ApiScaleService({ get }, { intervalMs: 500, offlineIntervalMs: 2000 });
    return { get, onReading, onConnection, service };
  }

  it("consulta a balança conectada e entrega o peso", async () => {
    const { get, onReading, onConnection, service } = setup([reading()]);
    const stop = service.subscribe(onReading, onConnection, { deviceId: ID });
    await flush();

    expect(get).toHaveBeenCalledWith("/api/produtor/balancas/A4CF129B07E1/leitura");
    expect(onConnection.mock.calls.map(([c]) => c)).toEqual(["connecting", "connected"]);
    expect(onReading).toHaveBeenCalledWith({ kg: 10.5, at: 1000 });
    stop();
  });

  it("consulta de novo a cada 0,5 s e só entrega leitura que o servidor recebeu de novo", async () => {
    const { get, onReading, service } = setup([reading({ em: 1000 }), reading({ em: 1000 }), reading({ em: 1500, kg: 10.52 })]);
    const stop = service.subscribe(onReading, undefined, { deviceId: ID });

    await flush(); // 1ª consulta
    await flush(500); // mesma leitura do servidor: não vira nova amostra
    await flush(500); // leitura nova
    expect(get).toHaveBeenCalledTimes(3);
    expect(onReading.mock.calls.map(([r]) => r)).toEqual([{ kg: 10.5, at: 1000 }, { kg: 10.52, at: 1500 }]);
    stop();
  });

  it("balança fora do ar vira 'lost', espera mais e volta sozinha", async () => {
    const { get, onReading, onConnection, service } = setup([reading({ online: false, kg: null, em: null }), reading({ em: 3000 })]);
    const stop = service.subscribe(onReading, onConnection, { deviceId: ID });

    await flush();
    expect(onConnection).toHaveBeenLastCalledWith("lost");
    expect(onReading).not.toHaveBeenCalled();

    await flush(500);
    expect(get).toHaveBeenCalledTimes(1); // ainda esperando os 2 s
    await flush(1500);
    expect(get).toHaveBeenCalledTimes(2);
    expect(onConnection).toHaveBeenLastCalledWith("connected");
    expect(onReading).toHaveBeenCalledWith({ kg: 10.5, at: 3000 });
    stop();
  });

  it("falha de rede também é 'lost' e não derruba a consulta", async () => {
    const { onReading, onConnection, service } = setup([new Error("sem rede"), reading({ em: 4000 })]);
    const stop = service.subscribe(onReading, onConnection, { deviceId: ID });

    await flush();
    expect(onConnection).toHaveBeenLastCalledWith("lost");
    await flush(2000);
    expect(onConnection).toHaveBeenLastCalledWith("connected");
    expect(onReading).toHaveBeenCalledTimes(1);
    stop();
  });

  it("sem balança conectada não consulta nada", async () => {
    const { get, onConnection, service } = setup([reading()]);
    service.subscribe(jest.fn(), onConnection, { deviceId: null });
    service.subscribe(jest.fn(), onConnection);
    await flush(5000);

    expect(get).not.toHaveBeenCalled();
    expect(onConnection.mock.calls.map(([c]) => c)).toEqual(["connecting", "lost", "connecting", "lost"]);
  });

  it("parar de ouvir para as consultas (mesmo uma já em andamento)", async () => {
    const { get, onReading, service } = setup([reading()]);
    const stop = service.subscribe(onReading, undefined, { deviceId: ID });
    stop();
    await flush(5000);

    expect(onReading).not.toHaveBeenCalled();
    expect(get.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
