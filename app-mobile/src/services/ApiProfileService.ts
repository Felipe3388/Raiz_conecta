import type { ApiClient } from "@/lib/http/ApiClient";
import type { EditableProfile, ProducerProfile } from "@/types/produtor";
import type { ProfileGateway } from "./ProfileGateway";

// O que GET /api/perfil/meus-dados devolve do produtor (a linha da tabela vendedor + tipoUser).
interface VendedorDto {
  email?: string | null;
  nomeFantasia?: string | null;
  telefone?: string | null;
  tipoDoc?: string | null;
  documento?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export function toProducerProfile(email: string, dto: VendedorDto): ProducerProfile {
  return {
    email: dto.email || email,
    nomeFantasia: dto.nomeFantasia ?? "",
    telefone: dto.telefone ?? "",
    tipoDoc: dto.tipoDoc === "CNPJ" ? "CNPJ" : "CPF",
    documento: dto.documento ?? "",
    cep: dto.cep ?? "",
    rua: dto.rua ?? "",
    numero: dto.numero ?? "",
    cidade: dto.cidade ?? "",
    estado: dto.estado ?? "",
  };
}

// Meu Perfil ligado à API do app-principal (GET, PUT e DELETE em /api/perfil/meus-dados).
export class ApiProfileService implements ProfileGateway {
  constructor(private readonly api: Pick<ApiClient, "get" | "put" | "delete">) {}

  async getProfile(email: string): Promise<ProducerProfile> {
    const dto = await this.api.get<VendedorDto>(this.path(email));
    return toProducerProfile(email, dto);
  }

  async updateProfile(email: string, changes: EditableProfile, newPassword?: string): Promise<ProducerProfile> {
    await this.api.put("/api/perfil/meus-dados", {
      email,
      tipoUser: "produtor",
      ...changes,
      ...(newPassword ? { novaSenha: newPassword } : {}),
    });
    return this.getProfile(email);
  }

  async deleteAccount(email: string): Promise<void> {
    await this.api.delete(this.path(email));
  }

  private path(email: string): string {
    return `/api/perfil/meus-dados?email=${encodeURIComponent(email)}`;
  }
}
