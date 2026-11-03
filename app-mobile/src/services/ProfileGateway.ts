import type { EditableProfile, ProducerProfile } from "@/types/produtor";

// Troca de senha: a API só aceita a nova quando vem junto a senha atual (quem pegou o celular emprestado não troca).
export interface PasswordChange {
  current: string;
  next: string;
}

// O que a tela Meu Perfil precisa. Implementado pela API (ApiProfileService) e pelo MockProfileService.
export interface ProfileGateway {
  // GET /api/perfil/meus-dados?email=
  getProfile(email: string): Promise<ProducerProfile>;
  // PUT /api/perfil/meus-dados (a troca de senha é opcional)
  updateProfile(email: string, changes: EditableProfile, password?: PasswordChange): Promise<ProducerProfile>;
  // DELETE /api/perfil/meus-dados?email=
  deleteAccount(email: string): Promise<void>;
}
