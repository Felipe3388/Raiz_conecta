import { digits, validateCadastro } from "@/lib/validation/cadastro";
import type { SignupDraft } from "./signupDraft";

// O passo 2 do cadastro (documento, endereço e o tipo do comprovante).
export interface SignupStep2 {
  tipoDoc: string;
  documento: string;
  tipoComprovante: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export const EMPTY_STEP2: SignupStep2 = { tipoDoc: "CPF", documento: "", tipoComprovante: "RG", cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "" };

export const PROOF_TYPES = [
  { value: "RG", label: "Carteira de Identidade (RG)" },
  { value: "CNH", label: "Carteira de Motorista (CNH)" },
  { value: "CONTRATO_SOCIAL", label: "Contrato Social (Empresas)" },
  { value: "CARTAO_CNPJ", label: "Cartão CNPJ" },
] as const;

// Confere os dois passos juntos e monta o corpo de POST /api/auth/cadastro. Devolve a mensagem do primeiro problema.
export function buildSignupForm(step1: SignupDraft, step2: SignupStep2, file: File | null): { ok: true; body: FormData } | { ok: false; error: string } {
  if (!file) return { ok: false, error: "Anexe a foto do seu documento para a validação." };
  const problem = validateCadastro({
    tipoUsuario: step1.tipoUsuario, nome: step1.nome, email: step1.email, senha: step1.senha, telefone: step1.telefone,
    tipoDoc: step2.tipoDoc, documento: step2.documento, cep: step2.cep, rua: step2.rua, numero: step2.numero, bairro: step2.bairro, cidade: step2.cidade, estado: step2.estado,
  });
  if (problem) return { ok: false, error: problem };

  const body = new FormData();
  body.set("email", step1.email);
  body.set("senha", step1.senha);
  body.set("nome", step1.nome);
  body.set("tipoUsuario", step1.tipoUsuario);
  body.set("telefone", step1.telefone);
  body.set("tipoDoc", step2.tipoDoc);
  body.set("documento", digits(step2.documento));
  body.set("cep", digits(step2.cep));
  for (const key of ["rua", "numero", "bairro", "cidade", "estado", "tipoComprovante"] as const) body.set(key, step2[key].trim());
  body.set("file", file);
  return { ok: true, body };
}
