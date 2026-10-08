import type { EditableProfile } from "@/types/produtor";
import { validateProfileEdit } from "./profileEdit";

const profile: EditableProfile = {
  nomeFantasia: "Sítio Boa Esperança",
  telefone: "(12) 91234-5678",
  cep: "18110-000",
  rua: "Estrada Rural",
  numero: "120",
  cidade: "Votorantim",
  estado: "SP",
};

describe("validateProfileEdit", () => {
  it("aceita os dados completos sem trocar a senha", () => {
    expect(validateProfileEdit(profile, "", "")).toBeNull();
  });

  it.each([
    [{ nomeFantasia: " " }, "Informe o nome fantasia ou razão social."],
    [{ telefone: "(12) 9123" }, "Informe um telefone válido com DDD."],
    [{ cep: "18110" }, "Informe um CEP válido."],
    [{ rua: "" }, "Informe a rua ou estrada."],
    [{ numero: "" }, "Informe o número (ou S/N)."],
    [{ cidade: "" }, "Informe a cidade."],
    [{ estado: "S" }, "Informe a UF com 2 letras."],
  ])("recusa %p", (override, message) => {
    expect(validateProfileEdit({ ...profile, ...override }, "", "")).toBe(message);
  });

  it("aceita trocar a senha por uma forte e repetida igual", () => {
    expect(validateProfileEdit(profile, "Nova@2026!", "Nova@2026!")).toBeNull();
  });

  it("recusa senha nova fraca", () => {
    expect(validateProfileEdit(profile, "fraca", "fraca")).toBe(
      "A nova senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).",
    );
  });

  it("recusa senha nova que não confere com a repetição", () => {
    expect(validateProfileEdit(profile, "Nova@2026!", "Outra@2026!")).toBe(
      "As senhas não coincidem. Verifique e tente novamente.",
    );
  });

  it("recusa repetição preenchida sem senha nova", () => {
    expect(validateProfileEdit(profile, "", "Nova@2026!")).toBe(
      "As senhas não coincidem. Verifique e tente novamente.",
    );
  });
});
