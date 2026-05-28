import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Recebe os dados ajustados pelo Modal do Admin
    const { idSugestao, nome, tipo, preco, unidadePadrao } = await req.json();

    if (!idSugestao) {
      return NextResponse.json({ error: "ID da sugestão é obrigatório" }, { status: 400 });
    }

    // 1. Busca a Sugestão no banco
    const sugestao = await prisma.sugestao.findUnique({
      where: { id: Number(idSugestao) }
    });

    if (!sugestao) {
      return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });
    }

    // 2. Cria o Produto Oficial usando os dados ajustados e a imagem da sugestão
    await prisma.produto.create({
      data: {
        nome: nome || sugestao.nomeProduto,
        tipo: tipo || "Outros",
        preco: Number(preco) || 0,
        unidadePadrao: unidadePadrao || "Kg",
        imagemUrl: sugestao.imagemUrl,
        status: "ATIVO"
      }
    });

    // 3. Apaga a Sugestão (já virou produto)
    await prisma.sugestao.delete({
      where: { id: Number(idSugestao) }
    });

    return NextResponse.json({ message: "Sugestão promovida a produto!" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao promover sugestão:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}