import { MockScaleLinkService } from "./MockScaleLinkService";

const NOW = new Date("2026-10-19T10:00:00.000Z");
const service = () => new MockScaleLinkService({ latencyMs: 0, now: () => NOW });

describe("MockScaleLinkService", () => {
  it("começa sem balança vinculada", async () => {
    expect(await service().getLink("ana@sitio.com")).toBeNull();
  });

  it("acha as balanças ao alcance", async () => {
    const devices = await service().findDevices();
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0]).toEqual({ id: expect.any(String), name: expect.any(String) });
  });

  it("vincula a balança e devolve a chave do par", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    const link = await gateway.link("ana@sitio.com", device.id);

    expect(link).toMatchObject({ deviceId: device.id, deviceName: device.name, linkedAt: NOW.toISOString() });
    expect(link.key).toMatch(/^P[0-9A-Z]{6}-B[0-9A-F]+$/);
    expect(await gateway.getLink("ana@sitio.com")).toEqual(link);
  });

  it("outro produtor tem outra chave, e a conta de um não enxerga a balança do outro", async () => {
    const gateway = service();
    const [first, second] = await gateway.findDevices();
    const ana = await gateway.link("ana@sitio.com", first.id);
    const bia = await gateway.link("bia@sitio.com", second.id);

    expect(ana.key).not.toBe(bia.key);
    expect(await gateway.getLink("bia@sitio.com")).toEqual(bia);
  });

  it("recusa uma balança que já está com outra conta", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await gateway.link("ana@sitio.com", device.id);
    await expect(gateway.link("bia@sitio.com", device.id)).rejects.toThrow("já está vinculada a outra conta");
  });

  it("recusa uma balança que não foi encontrada", async () => {
    await expect(service().link("ana@sitio.com", "00:00:00:00:00:00")).rejects.toThrow("Não encontramos");
  });

  it("aceita o endereço escrito de outro jeito", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    const link = await gateway.link("ana@sitio.com", device.id.toLowerCase().replace(/:/g, "-"));
    expect(link.deviceId).toBe(device.id);
  });

  it("desvincula", async () => {
    const gateway = service();
    const [device] = await gateway.findDevices();
    await gateway.link("ana@sitio.com", device.id);
    await gateway.unlink("ana@sitio.com");
    expect(await gateway.getLink("ana@sitio.com")).toBeNull();
    // e a balança fica livre para outra conta
    await expect(gateway.link("bia@sitio.com", device.id)).resolves.toBeDefined();
  });
});
