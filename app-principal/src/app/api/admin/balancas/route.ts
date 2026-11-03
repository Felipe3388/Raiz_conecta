import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError, text } from "@/lib/api/http";
import { adminScale } from "@/lib/iot/admin";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { MAX_SCALE_NAME_LENGTH } from "@/lib/iot/name";
import { generateSecret, hashSecret } from "@/lib/iot/secret";

// Cadastro das balanças de fábrica: só o administrador.

// GET: todas as balanças, com dono, sinal e última leitura.
export async function GET(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const rows = await prisma.balanca.findMany({ orderBy: { criadoEm: "desc" } });
    return NextResponse.json(rows.map(adminScale));
  } catch (error) {
    return serverError("admin.balancas.listar", error, "Erro ao buscar balanças");
  }
}

// POST { deviceId, nome? }: cadastra uma balança nova. O segredo do módulo aparece UMA vez, nesta resposta
// (grave-o no firmware do ESP32); no banco fica só o hash.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const informed = text(body?.deviceId);
    if (!isValidDeviceId(informed)) return fail(400, "Informe o endereço MAC da balança (12 letras/números, ex.: A4:CF:12:9B:07:E1).");
    const deviceId = normalizeDeviceId(informed);
    const nome = text(body?.nome).slice(0, MAX_SCALE_NAME_LENGTH) || `Balança RC-${deviceId.slice(-4)}`;

    const segredo = generateSecret();
    const row = await prisma.balanca.create({ data: { deviceId, nome, segredoHash: hashSecret(segredo) } });
    return NextResponse.json({ balanca: adminScale(row), segredo }, { status: 201 });
  } catch (error) {
    if (prismaCode(error) === "P2002") return fail(409, "Já existe uma balança com este endereço.");
    return serverError("admin.balancas.criar", error, "Erro ao cadastrar a balança");
  }
}
