import { stableReading } from "@/lib/delivery/scale";
import { MockScaleService } from "./MockScaleService";
import type { ScaleReading } from "./ScaleGateway";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function listen(scale: MockScaleService) {
  const readings: ScaleReading[] = [];
  const stop = scale.subscribe((reading) => readings.push(reading));
  return { readings, stop };
}

describe("MockScaleService", () => {
  it("balança vazia manda leituras perto de zero", () => {
    const { readings } = listen(new MockScaleService());
    jest.advanceTimersByTime(600);

    expect(readings.length).toBeGreaterThanOrEqual(3);
    expect(readings.every((reading) => reading.kg < 0.05)).toBe(true);
  });

  it("o produto colocado vai aparecendo e assenta no peso", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(9.88);
    jest.advanceTimersByTime(3000);

    const kgs = readings.map((reading) => reading.kg);
    // Sobe aos poucos (não aparece de uma vez) e termina estável no peso colocado.
    expect(kgs[0]).toBeLessThan(9.88);
    expect(stableReading(kgs)).toBe(9.88);
  });

  it("peso grande também assenta", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(784);
    jest.advanceTimersByTime(4000);

    expect(stableReading(readings.map((reading) => reading.kg))).toBe(784);
  });

  it("tirar o produto leva a leitura de volta a zero", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(5);
    jest.advanceTimersByTime(3000);
    scale.simulator.clear();
    jest.advanceTimersByTime(3000);

    expect(readings[readings.length - 1].kg).toBeLessThan(0.05);
  });

  it("peso inválido colocado vira balança vazia", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(Number.NaN);
    jest.advanceTimersByTime(600);
    scale.simulator.place(-4);
    jest.advanceTimersByTime(600);

    expect(readings.every((reading) => reading.kg < 0.05)).toBe(true);
  });

  it("enquanto oscila não conta como estável; só depois de assentar", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(6);
    jest.advanceTimersByTime(150 * 6);
    expect(stableReading(readings.map((reading) => reading.kg))).toBeNull();

    jest.advanceTimersByTime(150 * 10);
    expect(stableReading(readings.map((reading) => reading.kg))).toBe(6);
  });

  it("o visor mostra de 10 em 10 gramas", () => {
    const scale = new MockScaleService();
    const { readings } = listen(scale);
    scale.simulator.place(9.876);
    jest.advanceTimersByTime(3000);

    expect(readings.every((reading) => Math.abs(reading.kg * 100 - Math.round(reading.kg * 100)) < 1e-6)).toBe(true);
    expect(readings[readings.length - 1].kg).toBe(9.88);
  });

  it("para de trabalhar quando ninguém mais ouve", () => {
    const scale = new MockScaleService();
    const { readings, stop } = listen(scale);
    jest.advanceTimersByTime(450);
    stop();
    const count = readings.length;
    jest.advanceTimersByTime(3000);

    expect(readings).toHaveLength(count);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("avisa que conectou", () => {
    const onConnection = jest.fn();
    new MockScaleService().subscribe(() => {}, onConnection);

    expect(onConnection).toHaveBeenCalledWith("connected");
  });

  it("vários ouvintes recebem a mesma leitura", () => {
    const scale = new MockScaleService();
    const a = listen(scale);
    const b = listen(scale);
    jest.advanceTimersByTime(450);

    expect(a.readings).toEqual(b.readings);
  });
});
