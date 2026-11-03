import { cleanScaleName } from "./name";
import { formatDeviceId } from "./deviceId";
import { linkKey } from "./linkKey";

// A balança como o app do produtor a recebe (o contrato de ScaleLink do app: types/scaleLink.ts).
export interface BalancaRow {
  deviceId: string;
  nome: string;
  apelido: string | null;
  vinculadaEm: Date | null;
  emailProdutor: string | null;
  conectada: boolean;
}

export function toScaleLink(row: BalancaRow, email: string) {
  return {
    deviceId: formatDeviceId(row.deviceId),
    deviceName: row.nome,
    nickname: row.apelido,
    key: linkKey(email, row.deviceId),
    linkedAt: (row.vinculadaEm ?? new Date(0)).toISOString(),
  };
}

export function toScaleState(rows: BalancaRow[], email: string) {
  const sorted = [...rows].sort((a, b) => (a.vinculadaEm?.getTime() ?? 0) - (b.vinculadaEm?.getTime() ?? 0));
  const active = sorted.find((row) => row.conectada);
  return {
    scales: sorted.map((row) => toScaleLink(row, email)),
    activeDeviceId: active ? formatDeviceId(active.deviceId) : null,
  };
}

export { cleanScaleName };
