import { MockScaleLinkService } from "./MockScaleLinkService";

const NOW = new Date("2026-10-19T10:00:00.000Z");
const service = () => new MockScaleLinkService({ latencyMs: 0, now: () => NOW });
const ANA = "ana@sitio.com";

describe("MockScaleLinkService", () => {
  it("começa sem balança", async () => {
    expect(await service().getState(ANA)).toEqual({ scales: [], activeDeviceId: null });
  });

  it("acha as balanças ao alcance", async () => {
    const devices = await service().findDevices();
    expect(devices.length).toBeGreaterThan(1);
    expect(devices[0]).toEqual({ id: expect.any(String), name: expect.any(String) });
  });

  it("adiciona a balança, deixa conectada e devolve a chave do par", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    const scale = await gateway.add(ANA, device.id);

    expect(scale).toMatchObject({
      deviceId: device.id,
      deviceName: device.name,
      nickname: null,
      linkedAt: NOW.toISOString(),
    });
    expect(scale.key).toMatch(/^P[0-9A-Z]{6}-B[0-9A-F]+$/);
    expect(await gateway.getState(ANA)).toEqual({ scales: [scale], activeDeviceId: device.id });
  });

  it("aceita mais de uma balança; a última adicionada fica conectada", async () => {
    const gateway = service();
    const [first, second] = await gateway.findDevices();
    await gateway.add(ANA, first.id);
    await gateway.add(ANA, second.id);

    const state = await gateway.getState(ANA);
    expect(state.scales.map((scale) => scale.deviceId)).toEqual([first.id, second.id]);
    expect(state.activeDeviceId).toBe(second.id);
  });

  it("adicionar de novo a mesma balança não duplica", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await gateway.add(ANA, device.id);
    await gateway.add(ANA, device.id.toLowerCase().replace(/:/g, "-"));
    expect((await gateway.getState(ANA)).scales).toHaveLength(1);
  });

  it("troca a balança conectada", async () => {
    const gateway = service();
    const [first, second] = await gateway.findDevices();
    await gateway.add(ANA, first.id);
    await gateway.add(ANA, second.id);
    await gateway.activate(ANA, first.id);
    expect((await gateway.getState(ANA)).activeDeviceId).toBe(first.id);
  });

  it("só conecta uma balança que está na conta", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await expect(gateway.activate(ANA, device.id)).rejects.toThrow("não está na sua conta");
  });

  it("dá nome à balança e volta ao original com null", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await gateway.add(ANA, device.id);

    expect((await gateway.rename(ANA, device.id, "Da horta")).nickname).toBe("Da horta");
    expect((await gateway.getState(ANA)).scales[0].nickname).toBe("Da horta");
    expect((await gateway.rename(ANA, device.id, null)).nickname).toBeNull();
  });

  it("remove uma balança; se era a conectada, fica sem nenhuma conectada", async () => {
    const gateway = service();
    const [first, second] = await gateway.findDevices();
    await gateway.add(ANA, first.id);
    await gateway.add(ANA, second.id);

    await gateway.remove(ANA, first.id);
    expect(await gateway.getState(ANA)).toMatchObject({ activeDeviceId: second.id });
    await gateway.remove(ANA, second.id);
    expect(await gateway.getState(ANA)).toEqual({ scales: [], activeDeviceId: null });
  });

  it("outro produtor tem outra chave, e a conta de um não enxerga a balança do outro", async () => {
    const gateway = service();
    const [first, second] = await gateway.findDevices();
    const ana = await gateway.add(ANA, first.id);
    const bia = await gateway.add("bia@sitio.com", second.id);

    expect(ana.key).not.toBe(bia.key);
    expect((await gateway.getState("bia@sitio.com")).scales).toEqual([bia]);
  });

  it("recusa uma balança que já está com outra conta, e libera quando ela é removida", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await gateway.add(ANA, device.id);
    await expect(gateway.add("bia@sitio.com", device.id)).rejects.toThrow("já está vinculada a outra conta");
    await gateway.remove(ANA, device.id);
    await expect(gateway.add("bia@sitio.com", device.id)).resolves.toBeDefined();
  });

  it("recusa uma balança que não foi encontrada", async () => {
    await expect(service().add(ANA, "00:00:00:00:00:00")).rejects.toThrow("Não encontramos");
  });
});
