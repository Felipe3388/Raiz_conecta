// Uma balança encontrada perto do celular. O `id` é o que a identifica no aparelho (endereço MAC do módulo).
export interface ScaleDevice {
  id: string;
  name: string;
}

// A balança vinculada ao produtor. `key` junta o id do produtor e o id da balança: só esse par abre a balança.
export interface ScaleLink {
  deviceId: string;
  deviceName: string;
  key: string;
  // Quando foi vinculada (data e hora completas).
  linkedAt: string;
}
