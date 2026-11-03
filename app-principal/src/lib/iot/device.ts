import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/http";
import { isValidDeviceId, normalizeDeviceId } from "./deviceId";
import { secretMatches } from "./secret";

// Quem fala é o MÓDULO, não uma pessoa: ele manda `X-Device-Id: A4:CF:12:9B:07:E1` e `Authorization: Device <segredo>`.
// Erro de qualquer tipo responde igual (401), para não revelar quais balanças existem.
const REFUSED = () => fail(401, "Balança não autorizada.");

export async function requireDevice(req: Request) {
  const id = req.headers.get("x-device-id") ?? "";
  const [scheme, secret] = (req.headers.get("authorization") ?? "").split(" ");
  if (!isValidDeviceId(id) || scheme?.toLowerCase() !== "device" || !secret) return { error: REFUSED() };

  const balanca = await prisma.balanca.findUnique({ where: { deviceId: normalizeDeviceId(id) } });
  if (!balanca || !secretMatches(secret, balanca.segredoHash)) return { error: REFUSED() };
  return { balanca };
}
