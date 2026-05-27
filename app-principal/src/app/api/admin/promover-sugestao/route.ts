import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { idSugestao } = await req.json();

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

    // 2. Cria o Produto Oficial usando os dados da sugestão e a imagem do Cloudinary
    await prisma.produto.create({
      data: {
        nome: sugestao.nomeProduto,
        tipo: "Outros", // Categoria padrão (Admin ajusta depois se quiser)
        preco: 0.00,    // Preço base
        unidadePadrao: "Kg",
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