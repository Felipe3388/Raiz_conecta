import { describe, expect, it } from "vitest";
import { buildSignupForm, EMPTY_STEP2, type SignupStep2 } from "./signupForm";
import type { SignupDraft } from "./signupDraft";

const step1: SignupDraft = { tipoUsuario: "produtor", nome: "Sítio Boa Vista", email: "a@b.com", telefone: "(15) 99999-1234", senha: "Raiz@2026!", confirmarSenha: "Raiz@2026!" };
const step2: SignupStep2 = { ...EMPTY_STEP2, documento: "123.456.789-01", cep: "18110-000", rua: " Estrada Rural ", numero: "12", bairro: "Centro", cidade: "Votorantim", estado: "SP" };
const file = new File(["x"], "rg.jpg", { type: "image/jpeg" });

describe("buildSignupForm", () => {
  it("sem o documento anexado, pede o arquivo", () => {
    expect(buildSignupForm(step1, step2, null)).toEqual({ ok: false, error: "Anexe a foto do seu documento para a validação." });
  });

  it("devolve o primeiro erro da validação", () => {
    expect(buildSignupForm(step1, { ...step2, cep: "181" }, file)).toEqual({ ok: false, error: "CEP inválido. Use os 8 números." });
  });

  it("monta o corpo com números limpos e textos aparados", () => {
    const result = buildSignupForm(step1, step2, file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.get("documento")).toBe("12345678901");
    expect(result.body.get("cep")).toBe("18110000");
    expect(result.body.get("rua")).toBe("Estrada Rural");
    expect(result.body.get("tipoComprovante")).toBe("RG");
    expect(result.body.get("file")).toBeInstanceOf(File);
  });
});
