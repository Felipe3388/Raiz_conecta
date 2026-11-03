import { ApiScaleLinkService } from "./ApiScaleLinkService";

function fakeApi() {
  return { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() };
}

const SCALE = { deviceId: "A4:CF:12:9B:07:E1", deviceName: "Balança 01", nickname: null, key: "RC-1", linkedAt: "2026-10-27T12:00:00.000Z" };

describe("ApiScaleLinkService", () => {
  it("pede o endereço e o código da etiqueta, em vez de procurar balanças", async () => {
    const service = new ApiScaleLinkService(fakeApi());
    expect(service.discovery).toBe("label");
    expect(await service.findDevices()).toEqual([]);
  });

  it("lê as balanças do produtor da sessão", async () => {
    const api = fakeApi();
    const state = { scales: [SCALE], activeDeviceId: SCALE.deviceId };
    api.get.mockResolvedValue(state);

    expect(await new ApiScaleLinkService(api).getState()).toEqual(state);
    expect(api.get).toHaveBeenCalledWith("/api/produtor/balancas");
  });

  it("vincula mandando o endereço sem separadores e o código da etiqueta", async () => {
    const api = fakeApi();
    api.post.mockResolvedValue(SCALE);

    const scale = await new ApiScaleLinkService(api).add("ana@sitio.com", "A4:CF:12:9B:07:E1", "K7M2-Q9XT");

    expect(scale).toEqual(SCALE);
    expect(api.post).toHaveBeenCalledWith("/api/produtor/balancas", { deviceId: "A4CF129B07E1", codigo: "K7M2-Q9XT" });
  });

  it("não manda código quando não há (balança que já é do produtor)", async () => {
    const api = fakeApi();
    api.post.mockResolvedValue(SCALE);
    await new ApiScaleLinkService(api).add("ana@sitio.com", "A4CF129B07E1");
    expect(api.post).toHaveBeenCalledWith("/api/produtor/balancas", { deviceId: "A4CF129B07E1" });
  });

  it("conecta, renomeia e remove pelo endereço", async () => {
    const api = fakeApi();
    api.patch.mockResolvedValue({ ...SCALE, nickname: "Horta" });
    const service = new ApiScaleLinkService(api);

    await service.activate("a", "A4:CF:12:9B:07:E1");
    expect(api.put).toHaveBeenCalledWith("/api/produtor/balancas/A4CF129B07E1/conectada");

    expect((await service.rename("a", "A4:CF:12:9B:07:E1", "Horta")).nickname).toBe("Horta");
    expect(api.patch).toHaveBeenCalledWith("/api/produtor/balancas/A4CF129B07E1", { apelido: "Horta" });
    await service.rename("a", "A4:CF:12:9B:07:E1", null);
    expect(api.patch).toHaveBeenLastCalledWith("/api/produtor/balancas/A4CF129B07E1", { apelido: null });

    await service.remove("a", "A4:CF:12:9B:07:E1");
    expect(api.delete).toHaveBeenCalledWith("/api/produtor/balancas/A4CF129B07E1");
  });

  it("repassa o erro do servidor (código errado, balança de outra conta)", async () => {
    const api = fakeApi();
    api.post.mockRejectedValue(new Error("Não encontramos essa balança. Confira o código da etiqueta."));
    await expect(new ApiScaleLinkService(api).add("a", "A4CF129B07E1", "AAAA-AAAA")).rejects.toThrow("Confira o código");
  });
});
