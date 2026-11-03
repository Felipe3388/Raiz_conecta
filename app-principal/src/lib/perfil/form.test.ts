import { describe, expect, it } from "vitest";
import { isProfileDirty, NO_PASSWORD_CHANGE, profileRequest, reviewProfile, toProfileForm } from "./form";

const dto = { email: "a@b.com", nomeFantasia: "Sítio Boa Vista", telefone: "15999991234", cep: "18110000", rua: "Rua A", numero: "10", bairro: null, cidade: "Votorantim", estado: "SP" };

describe("formulário do perfil", () => {
  it("lê o que veio do banco com máscaras e vazios", () => {
    expect(toProfileForm(dto)).toMatchObject({ telefone: "(15) 99999-1234", cep: "18110-000", bairro: "" });
  });

  it("sabe quando há algo para salvar", () => {
    const saved = toProfileForm(dto);
    expect(isProfileDirty(saved, saved, NO_PASSWORD_CHANGE)).toBe(false);
    expect(isProfileDirty({ ...saved, cidade: "Sorocaba" }, saved, NO_PASSWORD_CHANGE)).toBe(true);
    expect(isProfileDirty(saved, saved, { ...NO_PASSWORD_CHANGE, atual: "x" })).toBe(true);
  });

  it("confere os dados e a troca de senha na ordem dos campos", () => {
    const form = toProfileForm(dto);
    expect(reviewProfile(form, NO_PASSWORD_CHANGE)).toBeNull();
    expect(reviewProfile({ ...form, cep: "1" }, NO_PASSWORD_CHANGE)).toBe("CEP inválido. Use os 8 números.");
    expect(reviewProfile(form, { atual: "", nova: "Nova@2027!", confirmar: "Nova@2027!" })).toBe("Informe a senha atual para trocar a senha.");
    expect(reviewProfile(form, { atual: "Raiz@2026!", nova: "fraca", confirmar: "fraca" })).toMatch(/senha/i);
    expect(reviewProfile(form, { atual: "Raiz@2026!", nova: "Nova@2027!", confirmar: "Outra@2027!" })).toMatch(/coincidem|iguais|conferem/i);
    expect(reviewProfile(form, { atual: "Nova@2027!", nova: "Nova@2027!", confirmar: "Nova@2027!" })).toBe("A nova senha precisa ser diferente da atual.");
    expect(reviewProfile(form, { atual: "Raiz@2026!", nova: "Nova@2027!", confirmar: "Nova@2027!" })).toBeNull();
  });

  it("só manda a senha quando a pessoa pediu para trocar", () => {
    const form = toProfileForm(dto);
    expect(profileRequest(form, NO_PASSWORD_CHANGE)).not.toHaveProperty("novaSenha");
    expect(profileRequest(form, { atual: "A", nova: "B", confirmar: "B" })).toMatchObject({ senhaAtual: "A", novaSenha: "B" });
  });
});
