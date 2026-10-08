import { ApiError } from "@/lib/http/ApiError";
import type { RegistrationData } from "@/types/registration";
import { MockRegistrationService } from "./MockRegistrationService";

function dataWithEmail(email: string): RegistrationData {
  return {
    account: {
      nome: "Fazenda",
      email,
      telefone: "(11) 99999-9999",
      senha: "Senha@123",
      confirmarSenha: "Senha@123",
      acceptedTerms: true,
    },
    profile: {
      documentType: "CPF",
      documento: "12345678901",
      proofType: "RG",
      cep: "18110000",
      rua: "Rua",
      numero: "1",
      bairro: "Centro",
      cidade: "Votorantim",
      estado: "SP",
      attachment: { uri: "x", name: "x.jpg", mimeType: "image/jpeg" },
    },
  };
}

describe("MockRegistrationService", () => {
  it("conclui o cadastro", async () => {
    const service = new MockRegistrationService({ latencyMs: 0 });

    await expect(service.register(dataWithEmail("nova@sitio.com"))).resolves.toBeUndefined();
  });

  it("e-mail começando com 'existente' reproduz e-mail já cadastrado", async () => {
    const service = new MockRegistrationService({ latencyMs: 0 });
    const promise = service.register(dataWithEmail("existente@sitio.com"));

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      message: "Este e-mail já está cadastrado.",
      status: 400,
    });
  });
});
