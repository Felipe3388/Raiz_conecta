import type { EditableProfile, ProducerProfile } from "@/types/produtor";

// O que a tela Meu Perfil precisa. Implementado pela API real (a fazer) e pelo MockProfileService.
export interface ProfileGateway {
  // GET /api/perfil/meus-dados?email=
  getProfile(email: string): Promise<ProducerProfile>;
  // PUT /api/perfil/meus-dados (newPassword é opcional)
  updateProfile(
    email: string,
    changes: EditableProfile,
    newPassword?: string,
  ): Promise<ProducerProfile>;
  // DELETE /api/perfil/meus-dados?email=
  deleteAccount(email: string): Promise<void>;
}
