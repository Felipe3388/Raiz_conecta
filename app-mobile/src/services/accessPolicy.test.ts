import type { AuthUser } from "@/types/auth";
import { evaluateAccess } from "./accessPolicy";

const produtor: AuthUser = {
  email: "ana@sitio.com",
  nome: "Sítio da Ana",
  tipoUser: "produtor",
  status: "APROVADO",
};

describe("evaluateAccess", () => {
  it("libera produtor aprovado", () => {
    expect(evaluateAccess(produtor)).toBeNull();
  });

  it.each([
    ["EM_ANALISE", "EM_ANALISE", "análise"],
    ["REJEITADO", "BLOQUEADO", "rejeitado"],
    ["SUSPENSO", "BLOQUEADO", "suspensa"],
  ])("bloqueia conta %s com mensagem específica", (status, code, trecho) => {
    const denial = evaluateAccess({ ...produtor, status });

    expect(denial?.code).toBe(code);
    expect(denial?.message.toLowerCase()).toContain(trecho);
  });

  it.each(["mercado", "admin"])("bloqueia perfil %s (app exclusivo do produtor)", (tipoUser) => {
    const denial = evaluateAccess({ ...produtor, tipoUser });

    expect(denial?.code).toBe("PERFIL_NAO_PERMITIDO");
  });

  it("verifica o perfil antes do status", () => {
    const denial = evaluateAccess({ ...produtor, tipoUser: "mercado", status: "EM_ANALISE" });

    expect(denial?.code).toBe("PERFIL_NAO_PERMITIDO");
  });
});
