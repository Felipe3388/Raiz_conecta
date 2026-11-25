import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { serverError } from "@/lib/api/http";
import { adminScale } from "@/lib/iot/admin";

// Visão do administrador sobre as balanças. Elas nascem no pareamento feito pelo produtor no app; aqui o admin só acompanha,
// libera (desvincula) e exclui.

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
