import { ApiProfileService } from "./ApiProfileService";

const vendedor = {
  email: "a@b.c",
  nomeFantasia: "Sítio X",
  telefone: "(11) 90000-0000",
  tipoDoc: "CNPJ",
  documento: "12345678000199",
  cep: "18110000",
  rua: "Rua A",
  numero: "10",
  cidade: "Votorantim",
  estado: "SP",
};
const changes = { nomeFantasia: "Sítio Y", telefone: "1", cep: "2", rua: "3", numero: "4", cidade: "5", estado: "SP" };

describe("ApiProfileService", () => {
  it("lê o perfil e preenche o que vier vazio", async () => {
    const api = { get: jest.fn().mockResolvedValue({ ...vendedor, rua: null }), put: jest.fn(), delete: jest.fn() };

    const profile = await new ApiProfileService(api).getProfile("a@b.c");

    expect(api.get).toHaveBeenCalledWith("/api/perfil/meus-dados?email=a%40b.c");
    expect(profile).toMatchObject({ nomeFantasia: "Sítio X", tipoDoc: "CNPJ", rua: "" });
  });

  it("salva com PUT (e senha nova só se houver) e lê de novo", async () => {
    const api = {
      get: jest.fn().mockResolvedValue({ ...vendedor, nomeFantasia: "Sítio Y" }),
      put: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
    };
    const service = new ApiProfileService(api);

    const updated = await service.updateProfile("a@b.c", changes, "Nova@123");
    expect(api.put).toHaveBeenCalledWith("/api/perfil/meus-dados", {
      email: "a@b.c",
      tipoUser: "produtor",
      ...changes,
      novaSenha: "Nova@123",
    });
    expect(updated.nomeFantasia).toBe("Sítio Y");

    await service.updateProfile("a@b.c", changes);
    expect(api.put.mock.calls[1][1]).not.toHaveProperty("novaSenha");
  });

  it("exclui a conta com DELETE", async () => {
    const api = { get: jest.fn(), put: jest.fn(), delete: jest.fn().mockResolvedValue({}) };
    await new ApiProfileService(api).deleteAccount("a@b.c");
    expect(api.delete).toHaveBeenCalledWith("/api/perfil/meus-dados?email=a%40b.c");
  });
});
