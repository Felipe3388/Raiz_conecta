import { UFS, digits } from "./cadastro";

// Os campos que a pessoa pode alterar em "Meu perfil" (e-mail, documento e situação da conta não mudam por aqui).
// Só entra o que veio como texto; o que veio vazio onde é obrigatório é recusado em vez de apagar o dado.
export interface PerfilChanges {
  nomeFantasia?: string;
  telefone?: string | null;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export type PerfilResult = { ok: true; data: PerfilChanges } | { ok: false; error: string };

const LIMITS = { nomeFantasia: 120, rua: 120, numero: 20, bairro: 80, cidade: 80 } as const;

export function parsePerfilChanges(body: Record<string, unknown>): PerfilResult {
  const data: PerfilChanges = {};
  const field = (key: string): string | null => (typeof body[key] === "string" ? (body[key] as string).trim() : null);

  const nome = field("nomeFantasia");
  if (nome !== null) {
    if (nome.length < 3) return { ok: false, error: "Informe o nome fantasia ou razão social (mínimo 3 letras)." };
    if (nome.length > LIMITS.nomeFantasia) return { ok: false, error: `O nome pode ter até ${LIMITS.nomeFantasia} letras.` };
    data.nomeFantasia = nome;
  }

  const telefone = field("telefone");
  if (telefone !== null) {
    if (telefone === "") data.telefone = null;
    else if (digits(telefone).length < 10 || digits(telefone).length > 11 || telefone.length > 20) return { ok: false, error: "Telefone inválido. Use DDD + número." };
    else data.telefone = telefone;
  }

  const cep = field("cep");
  if (cep !== null) {
    if (digits(cep).length !== 8) return { ok: false, error: "CEP inválido. Use os 8 números." };
    data.cep = digits(cep);
  }

  for (const key of ["rua", "numero", "cidade"] as const) {
    const value = field(key);
    if (value === null) continue;
    if (!value) return { ok: false, error: "Preencha rua, número e cidade." };
    if (value.length > LIMITS[key]) return { ok: false, error: `O campo ${key} é longo demais.` };
    data[key] = value;
  }

  const bairro = field("bairro");
  if (bairro !== null) {
    if (bairro.length > LIMITS.bairro) return { ok: false, error: "O bairro é longo demais." };
    data.bairro = bairro;
  }

  const estado = field("estado");
  if (estado !== null) {
    if (!(UFS as readonly string[]).includes(estado.toUpperCase())) return { ok: false, error: "Estado inválido. Use a sigla, como SP." };
    data.estado = estado.toUpperCase();
  }

  return { ok: true, data };
}
