import type { RegistrationData } from "@/types/registration";
import { RegistrationService } from "./RegistrationService";

const attachment = { uri: "file:///doc.jpg", name: "doc.jpg", mimeType: "image/jpeg" };

const data: RegistrationData = {
  account: {
    nome: "Fazenda São João",
    email: "ana@sitio.com",
    telefone: "(11) 99999-9999",
    senha: "Senha@123",
    confirmarSenha: "Senha@123",
    acceptedTerms: true,
  },
  profile: {
    documentType: "CPF",
    documento: "123.456.789-01",
    proofType: "RG",
    cep: "18110-000",
    rua: "Estrada Rural",
    numero: "12",
    bairro: "Centro",
    cidade: "Votorantim",
    estado: "SP",
    attachment,
  },
};

describe("RegistrationService", () => {
  it("envia os campos e o comprovante para POST /api/auth/cadastro", async () => {
    const api = { postForm: jest.fn().mockResolvedValue({ message: "ok" }) };
    const appendFile = jest.fn().mockResolvedValue(undefined);

    await new RegistrationService(api, appendFile).register(data);

    expect(api.postForm).toHaveBeenCalledTimes(1);
    const [path, form] = api.postForm.mock.calls[0];
    expect(path).toBe("/api/auth/cadastro");
    expect(form).toBeInstanceOf(FormData);
    expect(appendFile).toHaveBeenCalledWith(form, "file", attachment);
  });

  it("não envia nada sem o comprovante", async () => {
    const api = { postForm: jest.fn() };
    const appendFile = jest.fn();
    const withoutFile = { ...data, profile: { ...data.profile, attachment: null } };

    await expect(new RegistrationService(api, appendFile).register(withoutFile)).rejects.toThrow(
      "Anexe a foto do seu documento para validação.",
    );
    expect(api.postForm).not.toHaveBeenCalled();
  });

  it("propaga o erro da API", async () => {
    const api = { postForm: jest.fn().mockRejectedValue(new Error("Este e-mail já está cadastrado.")) };

    await expect(
      new RegistrationService(api, jest.fn().mockResolvedValue(undefined)).register(data),
    ).rejects.toThrow("Este e-mail já está cadastrado.");
  });
});
