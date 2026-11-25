import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, fail, readJson, serverError, text } from "@/lib/api/http";
import { FailureLimiter } from "@/lib/security/rateLimit";
import { deviceConfig } from "@/lib/iot/config";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { pairDevice } from "@/lib/iot/links";
import { REFUSAL_OTHER_ACCOUNT, hashPairingToken, isPairingTokenFormat } from "@/lib/iot/pairing";

// O módulo (ESP32), já no Wi-Fi do produtor, apresenta o token que o app lhe entregou. O servidor vincula a balança ao
// produtor do token, gera o segredo do módulo e o entrega UMA vez na resposta (o módulo o guarda na memória flash).
//
// Cabeçalhos: `X-Device-Id: A4:CF:12:9B:07:E1` e, se o módulo ainda guarda um segredo de pareamento anterior,
// `Authorization: Device <segredo>` (prova de que é ele; só vale para trocar de dono uma balança que já tem dono).
// Corpo: { token, firmware? }. Respostas: 200 { ok, segredo, hora, ...intervalos }, 400, 401 (token inválido ou vencido),
// 409 (balança de outra conta), 429.

// Quem erra o token várias vezes está tentando adivinhar: 10 erros em 15 minutos, por IP, travam por um tempo.
const limiter = new FailureLimiter({ max: 10, windowMs: 15 * 60_000 });
const INVALID_TOKEN = "Pareamento inválido ou vencido.";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const wait = limiter.retryAfterSeconds(ip);
    if (wait > 0) {
      const response = fail(429, "Muitas tentativas. Tente de novo mais tarde.");
      response.headers.set("Retry-After", String(wait));
      return response;
    }

    const informedId = req.headers.get("x-device-id") ?? "";
    if (!isValidDeviceId(informedId)) return fail(400, "Identificação da balança inválida.");
    const deviceId = normalizeDeviceId(informedId);

    const body = await readJson(req);
    const token = text(body?.token).toLowerCase();
    const firmware = text(body?.firmware).slice(0, 32) || null;
    if (!isPairingTokenFormat(token)) {
      limiter.fail(ip);
      return fail(401, INVALID_TOKEN);
    }

    const [scheme, proof] = (req.headers.get("authorization") ?? "").split(" ");
    const now = new Date();

    const pareamento = await prisma.pareamentoBalanca.findUnique({ where: { tokenHash: hashPairingToken(token) } });
    // Vale se ainda não venceu e nunca foi usado, ou se foi usado por este mesmo módulo (a resposta pode ter se perdido no Wi-Fi).
    const usable =
      pareamento !== null &&
      pareamento.expiraEm.getTime() > now.getTime() &&
      (pareamento.usadoEm === null || pareamento.deviceId === deviceId);
    if (!pareamento || !usable) {
      limiter.fail(ip);
      return fail(401, INVALID_TOKEN);
    }

    const result = await prisma.$transaction(async (tx) => {
      const paired = await pairDevice(tx, {
        email: pareamento.emailProdutor,
        deviceId,
        firmware,
        proof: scheme?.toLowerCase() === "device" && proof ? proof : null,
        now,
      });
      await tx.pareamentoBalanca.update({
        where: { id: pareamento.id },
        data: paired.ok ? { usadoEm: pareamento.usadoEm ?? now, deviceId, recusa: null } : { deviceId, recusa: REFUSAL_OTHER_ACCOUNT },
      });
      return paired;
    });

    if (!result.ok) return fail(409, "Esta balança já está vinculada a outra conta.");

    const response = NextResponse.json({ ok: true, segredo: result.secret, hora: now.getTime(), vinculada: true, ...deviceConfig() });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return serverError("iot.vincular.falhou", error);
  }
}
