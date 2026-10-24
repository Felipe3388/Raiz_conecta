// Uma balança encontrada perto do celular. O `id` é o que a identifica no aparelho (endereço MAC do módulo).
export interface ScaleDevice {
  id: string;
  name: string;
}

// Uma balança do produtor. `key` junta o id do produtor e o id da balança: só esse par abre a balança.
// Não aparece para o produtor; ele vê só o nome.
export interface ScaleLink {
  deviceId: string;
  deviceName: string;
  // Nome que o produtor deu (Configurações). Sem ele vale o nome da balança.
  nickname: string | null;
  key: string;
  // Quando foi adicionada (data e hora completas).
  linkedAt: string;
}

// As balanças do produtor e qual delas está conectada (a que a pesagem usa). Pode não haver nenhuma conectada.
export interface ScaleState {
  scales: ScaleLink[];
  activeDeviceId: string | null;
}
