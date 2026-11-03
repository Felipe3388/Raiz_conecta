import type { ScaleDevice, ScaleLink, ScaleState } from "@/types/scaleLink";

// As balanças do produtor. O servidor guarda a chave do par produtor + balança e só aceita pesos de uma balança do
// produtor que está logado. Duas implementações: MockScaleLinkService (simulada) e ApiScaleLinkService (o site).
export interface ScaleLinkGateway {
  // Como o produtor encontra a balança nova: "scan" procura as que estão perto do celular (simulado); "label" pede o
  // endereço e o código da etiqueta da balança (API real: o servidor não consegue procurar balanças perto do celular).
  readonly discovery: "scan" | "label";
  // GET /api/produtor/balancas: as balanças do produtor e qual está conectada.
  getState(email: string): Promise<ScaleState>;
  // As balanças ao alcance do celular (só em "scan"). Quem procura é o aparelho; não passa pelo servidor.
  findDevices(): Promise<ScaleDevice[]>;
  // POST /api/produtor/balancas: adiciona a balança escolhida e a deixa conectada. `code` é o código da etiqueta (em "label").
  add(email: string, deviceId: string, code?: string): Promise<ScaleLink>;
  // PUT /api/produtor/balancas/{id}/conectada: passa a usar outra das balanças já adicionadas.
  activate(email: string, deviceId: string): Promise<void>;
  // PATCH /api/produtor/balancas/{id}: o nome que o produtor deu à balança (null volta ao original).
  rename(email: string, deviceId: string, nickname: string | null): Promise<ScaleLink>;
  // DELETE /api/produtor/balancas/{id}: tira a balança da conta. Se era a conectada, fica sem nenhuma.
  remove(email: string, deviceId: string): Promise<void>;
}
