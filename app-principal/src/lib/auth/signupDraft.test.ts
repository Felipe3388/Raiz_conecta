import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSignupDraft, finishSignup, readSignupDraft, readSignupSent, saveSignupDraft, subscribeSignupDraft, type SignupDraft } from "./signupDraft";

const draft: SignupDraft = { tipoUsuario: "produtor", nome: "Sítio", email: "a@b.com", telefone: "", senha: "Raiz@2026!", confirmarSenha: "Raiz@2026!" };

afterEach(clearSignupDraft);

describe("signupDraft", () => {
  it("ao enviar, apaga o rascunho (com a senha) e guarda só e-mail e primeiro nome", () => {
    expect(finishSignup()).toBeNull();
    saveSignupDraft({ ...draft, nome: "  Maria da Silva ", email: " maria@sitio.com " });
    expect(finishSignup()).toEqual({ email: "maria@sitio.com", primeiroNome: "Maria" });
    expect(readSignupDraft()).toBeNull();
    expect(readSignupSent()).toEqual({ email: "maria@sitio.com", primeiroNome: "Maria" });
    expect(JSON.stringify(readSignupSent())).not.toContain("Raiz@2026!");
  });

  it("guarda uma cópia e limpa", () => {
    expect(readSignupDraft()).toBeNull();
    saveSignupDraft(draft);
    expect(readSignupDraft()).toEqual(draft);
    expect(readSignupDraft()).not.toBe(draft);
    clearSignupDraft();
    expect(readSignupDraft()).toBeNull();
  });

  it("avisa quem acompanha, até a pessoa parar de acompanhar", () => {
    const listener = vi.fn();
    const stop = subscribeSignupDraft(listener);
    saveSignupDraft(draft);
    clearSignupDraft();
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    saveSignupDraft(draft);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("não usa o storage do navegador", () => {
    const set = vi.fn();
    vi.stubGlobal("sessionStorage", { setItem: set });
    vi.stubGlobal("localStorage", { setItem: set });
    saveSignupDraft(draft);
    expect(set).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
