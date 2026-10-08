import type { EditableProfile } from "@/types/produtor";
import { MockProfileService } from "./MockProfileService";

const ME = "maria@sitio.com";

const changes: EditableProfile = {
  nomeFantasia: "Sítio Novo Nome",
  telefone: "(12) 98888-7777",
  cep: "18110-000",
  rua: "Rua Nova",
  numero: "10",
  cidade: "Sorocaba",
  estado: "SP",
};

describe("MockProfileService", () => {
  it("mostra o perfil com o e-mail de quem entrou", async () => {
    const profile = await new MockProfileService({ latencyMs: 0 }).getProfile(ME);

    expect(profile.email).toBe(ME);
    expect(profile.nomeFantasia).not.toBe("");
    expect(["CPF", "CNPJ"]).toContain(profile.tipoDoc);
  });

  it("guarda as alterações e mantém e-mail e documento", async () => {
    const service = new MockProfileService({ latencyMs: 0 });
    const original = await service.getProfile(ME);

    const updated = await service.updateProfile(ME, changes);

    expect(updated).toMatchObject(changes);
    expect(updated.email).toBe(original.email);
    expect(updated.documento).toBe(original.documento);
    expect(await service.getProfile(ME)).toEqual(updated);
  });

  it("depois de excluir a conta, o perfil não existe mais", async () => {
    const service = new MockProfileService({ latencyMs: 0 });

    await service.deleteAccount(ME);

    await expect(service.getProfile(ME)).rejects.toThrow("Conta não encontrada.");
  });
});
