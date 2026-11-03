import { NextResponse } from "next/server";

// Sair: apaga o cookie da sessão (o site também limpa o que guardou no navegador).
export async function POST() {
  const response = NextResponse.json({ message: "Sessão encerrada." });
  response.cookies.set("token", "", { path: "/", maxAge: 0 });
  return response;
}
