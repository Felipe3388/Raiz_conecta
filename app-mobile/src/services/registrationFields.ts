import { digitsOnly } from "@/lib/format/masks";
import type { RegistrationData } from "@/types/registration";

// O app mobile cadastra apenas produtores.
const PRODUCER_ROLE = "produtor";

// Campos de texto no formato esperado por POST /api/auth/cadastro (o arquivo vai à parte).
export function buildRegistrationFields({
  account,
  profile,
}: RegistrationData): Record<string, string> {
  return {
    tipoUsuario: PRODUCER_ROLE,
    nome: account.nome.trim(),
    email: account.email.trim(),
    senha: account.senha,
    telefone: account.telefone,
    tipoDoc: profile.documentType,
    documento: digitsOnly(profile.documento),
    tipoComprovante: profile.proofType,
    cep: digitsOnly(profile.cep),
    rua: profile.rua.trim(),
    numero: profile.numero.trim(),
    bairro: profile.bairro.trim(),
    cidade: profile.cidade.trim(),
    estado: profile.estado.trim().toUpperCase(),
  };
}
