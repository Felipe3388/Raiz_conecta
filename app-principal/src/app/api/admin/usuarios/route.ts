/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ROTA GET: Busca TODOS os usuários (produtores e mercados) para exibir na tela de administração
export async function GET() {
  try {
    const produtores = await prisma.vendedor.findMany({
      orderBy: { nomeFantasia: "asc" },
    });
    const mercados = await prisma.cliente.findMany({
      orderBy: { nomeFantasia: "asc" },
    });

    const todosUsuarios = [
      ...produtores.map((p) => ({ ...p, tipo: "produtor" })),
      ...mercados.map((m) => ({ ...m, tipo: "mercado" })),
    ];

    return NextResponse.json(todosUsuarios);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 },
    );
  }
}

// PUT: Atualiza o status (Aprovar, Rejeitar, Suspender, Reativar)
export async function PUT(req: Request) {
  try {
    const { email, tipo, novoStatus } = await req.json();

    if (!email || !tipo || !novoStatus) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Atualiza a Tabela Principal (Produtor ou Mercado)
    if (tipo === "produtor") {
      await prisma.vendedor.update({
        where: { email },
        data:
          novoStatus === "REJEITADO"
            ? { status: novoStatus, urlDocumento: null }
            : { status: novoStatus },
      });
    } else if (tipo === "mercado") {
      await prisma.cliente.update({
        where: { email },
        data: { status: novoStatus },
      });
    }

    // Atualiza a Tabela de ACESSO (Para o login liberar ou bloquear)
    await prisma.acesso.updateMany({
      where: { login: email },
      data: { status: novoStatus },
    });

    // Integração com o microsserviço de e-mail (Apenas para Aprovação/Rejeição inicial)
    if (novoStatus === "APROVADO") {
      try {
        await fetch("http://localhost:3001/api/email/aprovacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, status: "aprovado" }),
        });
      } catch (e) {
        console.log("Aviso: Microsserviço de e-mail offline.");
      }
    } else if (novoStatus === "REJEITADO") {
      try {
        await fetch("http://localhost:3001/api/email/rejeicao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, status: "rejeitado" }),
        });
      } catch (e) {
        console.log("Aviso: Microsserviço de e-mail offline.");
      }
    }

    return NextResponse.json(
      { message: `Status alterado para ${novoStatus}` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// ROTA DELETE: Exclui o usuário permanentemente
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const tipo = searchParams.get("tipo");

    if (!email || !tipo)
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    if (tipo === "produtor") {
      await prisma.vendedor.delete({ where: { email } });
    } else {
      await prisma.cliente.delete({ where: { email } });
    }

    // Apaga também o login dele
    await prisma.acesso.deleteMany({ where: { login: email } });

    return NextResponse.json(
      { message: "Usuário excluído com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir. Pode haver pedidos vinculados." },
      { status: 500 },
    );
  }
}
