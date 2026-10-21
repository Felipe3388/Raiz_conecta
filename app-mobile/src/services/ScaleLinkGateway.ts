import type { ScaleDevice, ScaleLink } from "@/types/scaleLink";

// O vínculo entre o produtor e a balança dele. Hoje só existe a versão simulada (MockScaleLinkService); o servidor
// guarda a chave do par produtor + balança e só aceita pesos de uma balança vinculada ao produtor que está logado.
export interface ScaleLinkGateway {
  // GET /api/produtor/balancas (a fazer): a balança vinculada, ou null.
  getLink(email: string): Promise<ScaleLink | null>;
  // As balanças ao alcance do celular. Quem procura é o aparelho (Bluetooth ou rede); não passa pelo servidor.
  findDevices(): Promise<ScaleDevice[]>;
  // POST /api/produtor/balancas (a fazer): vincula a balança escolhida e devolve a chave do par.
  link(email: string, deviceId: string): Promise<ScaleLink>;
  // DELETE /api/produtor/balancas/{id} (a fazer)
  unlink(email: string): Promise<void>;
}
