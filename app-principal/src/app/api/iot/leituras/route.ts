import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, readJson, serverError } from "@/lib/api/http";
import { requireDevice } from "@/lib/iot/device";
import { parseReadings, readingsToStore } from "@/lib/iot/readings";

// Quem chama é o módulo da balança (ESP32). Autenticação: `X-Device-Id` + `Authorization: Device <segredo>`.
// Corpo: { firmware?, leituras: [{ kg, estavel?, t? }] }. Lista vazia vale como "estou vivo".
// Resposta: { ok, hora, vinculada } — `hora` deixa o módulo acertar o relógio sem precisar de NTP.

// O histórico de pesagens guarda 90 dias; mais velho que isso é apagado junto de uma gravação nova.
const RETENTION_MS = 90 * 24 * 60 * 60_000;

export async function POST(req: Request) {
  const auth = await requireDevice(req);
  if (auth.error) return auth.error;
  const { balanca } = auth;

  try {
    const body = await readJson(req);
    const parsed = parseReadings(body);
    if (!parsed.ok) return fail(400, parsed.error);

    const now = new Date();
    const last = parsed.leituras.at(-1);
    // Sem dono, a balança só avisa que está viva; o histórico começa no vínculo.
    const toStore = balanca.emailProdutor
      ? readingsToStore(parsed.leituras, { kg: balanca.ultimoKg, estavel: balanca.ultimoEstavel })
      : [];

    await prisma.$transaction([
      prisma.balanca.update({
        where: { id: balanca.id },
        data: {
          ultimoContato: now,
          ...(parsed.firmware ? { firmware: parsed.firmware } : {}),
          ...(last ? { ultimoKg: last.kg, ultimoEstavel: last.estavel, ultimaLeitura: last.medidoEm } : {}),
        },
      }),
      ...(toStore.length > 0
        ? [
            prisma.leituraPeso.createMany({
              data: toStore.map((reading) => ({ balancaId: balanca.id, kg: reading.kg, medidoEm: reading.medidoEm })),
            }),
            prisma.leituraPeso.deleteMany({ where: { balancaId: balanca.id, medidoEm: { lt: new Date(now.getTime() - RETENTION_MS) } } }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true, hora: now.getTime(), vinculada: balanca.emailProdutor !== null });
  } catch (error) {
    return serverError("iot.leituras.falhou", error);
  }
}
