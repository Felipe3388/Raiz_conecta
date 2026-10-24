import type { ScaleDevice, ScaleLink, ScaleState } from "@/types/scaleLink";

// As balanças do produtor. Hoje só existe a versão simulada (MockScaleLinkService); o servidor guarda a chave do par
// produtor + balança e só aceita pesos de uma balança do produtor que está logado.
export interface ScaleLinkGateway {
  // GET /api/produtor/balancas (a fazer): as balanças do produtor e qual está conectada.
  getState(email: string): Promise<ScaleState>;
  // As balanças ao alcance do celular. Quem procura é o aparelho (Bluetooth ou rede); não passa pelo servidor.
  findDevices(): Promise<ScaleDevice[]>;
  // POST /api/produtor/balancas (a fazer): adiciona a balança escolhida e a deixa conectada.
  add(email: string, deviceId: string): Promise<ScaleLink>;
  // PUT /api/produtor/balancas/{id}/conectada (a fazer): passa a usar outra das balanças já adicionadas.
  activate(email: string, deviceId: string): Promise<void>;
  // PATCH /api/produtor/balancas/{id} (a fazer): o nome que o produtor deu à balança (null volta ao original).
  rename(email: string, deviceId: string, nickname: string | null): Promise<ScaleLink>;
  // DELETE /api/produtor/balancas/{id} (a fazer): tira a balança da conta. Se era a conectada, fica sem nenhuma.
  remove(email: string, deviceId: string): Promise<void>;
}
