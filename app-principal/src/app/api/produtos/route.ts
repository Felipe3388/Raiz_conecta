import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// LER PRODUTOS
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(produtos);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}

// CRIAR NOVO PRODUTO COM IMAGEM — SCRUM-130 (Cloudinary)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = formData.get("nome") as string;
    const tipo = formData.get("tipo") as string;
    const preco = formData.get("preco") as string;
    const unidadePadrao = formData.get("unidadePadrao") as string;
    const file = formData.get("file") as File;

    let imagemUrl = "";

    // Upload para o Cloudinary (persistente no Vercel)
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "raiz-conecta/produtos", resource_type: "image" },
              (error, result) => {
                if (error || !result) return reject(error);
                resolve(result as { secure_url: string });
              },
            )
            .end(buffer);
        },
      );

      imagemUrl = uploadResult.secure_url;
    }

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        tipo,
        preco: parseFloat(preco),
        imagemUrl,
        unidadePadrao,
        status: "ATIVO",
      },
    });

    return NextResponse.json(novoProduto, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao cadastrar o produto" },
      { status: 500 },
    );
  }
}

// EXCLUIR PRODUTO (remove também do Cloudinary se tiver public_id)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "ID não informado" },
        { status: 400 },
      );

    const produto = await prisma.produto.findUnique({
      where: { cdProduto: Number(id) },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Se a imagem estiver no Cloudinary, tenta remover
    if (produto.imagemUrl && produto.imagemUrl.includes("cloudinary.com")) {
      try {
        // Extrai o public_id da URL do Cloudinary
        const parts = produto.imagemUrl.split("/");
        const fileWithExt = parts[parts.length - 1];
        const publicId = `raiz-conecta/produtos/${fileWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("Aviso: imagem não removida do Cloudinary.", err);
      }
    }

    await prisma.produto.delete({
      where: { cdProduto: Number(id) },
    });

    return NextResponse.json({ message: "Produto apagado com sucesso" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Erro ao apagar. O produto já pode estar atrelado a um produtor.",
      },
      { status: 500 },
    );
  }
}

// 🚀 PUT: Admin edita um produto existente (SCRUM-138)
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, nome, tipo, preco, unidadePadrao } = data;

    if (!id) {
      return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
    }

    // Tratamento de segurança para o preço (garante que vírgulas virem pontos para o banco)
    const precoFormatado = typeof preco === 'string'
      ? parseFloat(preco.replace(',', '.'))
      : Number(preco);

    // Atualiza o produto direto no banco
    const produtoAtualizado = await prisma.produto.update({
      where: { cdProduto: Number(id) },
      data: {
        nome,
        tipo,
        preco: precoFormatado,
        unidadePadrao,
      },
    });

    return NextResponse.json(produtoAtualizado, { status: 200 });
  } catch (error) {
    console.error("Erro no PUT /api/produtos:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}