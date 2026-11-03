import jwt from "jsonwebtoken";
import { getJwtSecret, type Role } from "@/lib/auth/jwt";

// Um token como o que o login cria, para os testes das rotas protegidas.
export function tokenFor(email = "maria@teste.com", role: Role = "produtor", status = "APROVADO"): string {
  return jwt.sign({ email, role, nome: "Teste", status }, getJwtSecret(), { expiresIn: "2h" });
}

export function authHeaders(email?: string, role?: Role): Record<string, string> {
  return { authorization: `Bearer ${tokenFor(email, role)}` };
}
