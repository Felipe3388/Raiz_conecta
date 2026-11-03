import { formatDeviceId } from "./deviceId";
import { formatCode, pairingCode } from "./pairing";
import { isOnline } from "./readings";

// A balança como a tela do administrador a vê. Nunca inclui o hash do segredo.
export function adminScale(row: {
  deviceId: string; nome: string; emailProdutor: string | null; apelido: string | null; conectada: boolean; firmware: string | null;
  ultimoContato: Date | null; ultimoKg: number | null; vinculadaEm: Date | null; criadoEm: Date;
}) {
  return {
    deviceId: formatDeviceId(row.deviceId),
    nome: row.nome,
    // O que vai impresso na etiqueta da balança.
    codigo: formatCode(pairingCode(row.deviceId)),
    emailProdutor: row.emailProdutor,
    apelido: row.apelido,
    conectada: row.conectada,
    online: isOnline(row.ultimoContato),
    firmware: row.firmware,
    ultimoContato: row.ultimoContato,
    ultimoKg: row.ultimoKg,
    vinculadaEm: row.vinculadaEm,
    criadoEm: row.criadoEm,
  };
}
