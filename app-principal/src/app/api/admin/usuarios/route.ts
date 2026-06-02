import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Busca TODOS os usuários (produtores, mercados e admins)
export async function GET() {
  try {
    const produtores = await prisma.vendedor.findMany({
      orderBy: { nomeFantasia: "asc" },
    });
    const mercados = await prisma.cliente.findMany({
      orderBy: { nomeFantasia: "asc" },
    });
    const admins = await prisma.acesso.findMany({
      where: { tipoUser: "admin" },
    });

    const todosUsuarios = [
      ...produtores.map((p) => ({ ...p, tipo: "produtor" })),
      ...mercados.map((m)   => ({ ...m, tipo: "mercado" })),
      ...admins.map((a)     => ({
        email: a.login,
        nomeFantasia: "Administrador",
        status: a.status,
        tipo: "admin",
      })),
    ];

    return NextResponse.json(todosUsuarios);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}

// PUT: Atualiza o status (Aprovar, Rejeitar, Suspender, Reativar)
export async function PUT(req: Request) {
  try {
    const { email, tipo, novoStatus, motivo } = await req.json();

    if (!email || !tipo || !novoStatus) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

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

    await prisma.acesso.updateMany({
      where: { login: email },
      data: { status: novoStatus },
    });

    // Microsserviço de e-mail — só chama se a URL estiver configurada
    if (process.env.MICROSERVICE_URL) {
      try {
        if (novoStatus === "APROVADO") {
          await fetch(`${process.env.MICROSERVICE_URL}/api/email/aprovacao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } else if (novoStatus === "REJEITADO") {
          await fetch(`${process.env.MICROSERVICE_URL}/api/email/rejeicao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } else if (novoStatus === "SUSPENSO") {
          await fetch(`${process.env.MICROSERVICE_URL}/api/email/suspensao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motivo: motivo || "" }),
          });
        }
      } catch (e) {
        console.log("Aviso: Microsserviço de e-mail indisponível.");
      }
    }

    return NextResponse.json(
      { message: `Status alterado para ${novoStatus}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Exclui o usuário permanentemente
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const tipo  = searchParams.get("tipo");
    const motivo = searchParams.get("motivo") || "";

    if (!email || !tipo)
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    // Envia e-mail de exclusão antes de apagar do banco
    if (process.env.MICROSERVICE_URL) {
      try {
        await fetch(`${process.env.MICROSERVICE_URL}/api/email/exclusao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, motivo }),
        });
      } catch (e) {
        console.log("Aviso: Microsserviço de e-mail indisponível.");
      }
    }

    if (tipo === "produtor") {
      await prisma.vendedor.delete({ where: { email } });
    } else if (tipo === "mercado") {
      await prisma.cliente.delete({ where: { email } });
    }

    await prisma.acesso.deleteMany({ where: { login: email } });

    return NextResponse.json({ message: "Usuário excluído com sucesso" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir. Pode haver pedidos vinculados." },
      { status: 500 }
    );
  }
}

// PATCH: Admin edita dados básicos de um usuário
export async function PATCH(req: Request) {
  try {
    const { email, tipo, nomeFantasia, telefone, cidade, estado } = await req.json();

    if (!email || !tipo) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const data = {
      ...(nomeFantasia && { nomeFantasia }),
      ...(telefone  !== undefined && { telefone }),
      ...(cidade    !== undefined && { cidade }),
      ...(estado    !== undefined && { estado }),
    };

    if (tipo === "produtor") {
      await prisma.vendedor.update({ where: { email }, data });
    } else if (tipo === "mercado") {
      await prisma.cliente.update({ where: { email }, data });
    }

    return NextResponse.json({ message: "Usuário atualizado com sucesso" }, { status: 200 });
  } catch (error) {
    console.error("Erro no PATCH /api/admin/usuarios:", error);
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}
