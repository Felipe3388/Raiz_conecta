import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { isOnline } from "@/lib/iot/readings";

// GET: o peso que a balança está mostrando agora. O app pergunta a cada meio segundo durante a pesagem.
// { online, kg, estavel, em } — sem contato recente (`online: false`), kg vem null: o app avisa "balança sem sinal".
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const rawId = (await params).id;
    if (!isValidDeviceId(rawId)) return fail(404, "Balança não encontrada.");

    const balanca = await prisma.balanca.findUnique({ where: { deviceId: normalizeDeviceId(rawId) } });
    if (!balanca || balanca.emailProdutor?.toLowerCase() !== auth.session.email.toLowerCase()) {
      return fail(404, "Balança não encontrada.");
    }

    const now = new Date();
    const online = isOnline(balanca.ultimoContato, now);
    const response = NextResponse.json({
      online,
      kg: online ? balanca.ultimoKg : null,
      estavel: online ? balanca.ultimoEstavel : false,
      em: balanca.ultimaLeitura?.getTime() ?? null,
      agora: now.getTime(),
    });
    // Dado ao vivo: nenhum cache (do navegador, do app ou do CDN) pode entregar um peso velho.
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return serverError("balancas.leitura", error, "Não foi possível ler a balança.");
  }
}
