import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Admin lê as sugestões
export async function GET() {
  try {
    const sugestoes = await prisma.sugestao.findMany({
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(sugestoes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

// POST: Produtor cria a sugestão com imagem e PREÇO
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const emailProdutor = formData.get("emailProdutor") as string;
    const nomeProduto = formData.get("nomeProduto") as string;
    const descricao = formData.get("descricao") as string;
    const precoSugerido = formData.get("precoSugerido") as string; // <--- NOVO
    const file = formData.get("file") as File;

    let imagemUrl = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "raiz-conecta/sugestoes", resource_type: "image" },
            (error, res) => {
              if (error || !res) return reject(error);
              resolve(res as { secure_url: string });
            }
          )
          .end(buffer);
      });
      imagemUrl = result.secure_url;
    }

    await prisma.sugestao.create({
      data: {
        emailProdutor,
        nomeProduto,
        descricao,
        imagemUrl,
        precoSugerido: precoSugerido ? parseFloat(precoSugerido) : null // <--- SALVA NO BANCO
      },
    });

    // Microsserviço de e-mail — só chama se URL configurada
    if (process.env.MICROSERVICE_URL) {
      try {
        await fetch(`${process.env.MICROSERVICE_URL}/api/email/sugestao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailProdutor, nomeProduto, descricao }),
        });
      } catch (e) {
        console.error("Microsserviço de e-mail indisponível.");
      }
    }

    return NextResponse.json({ message: "Enviado com sucesso!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// DELETE: Admin apaga a sugestão (remove do Cloudinary também)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const sugestao = await prisma.sugestao.findUnique({
      where: { id: Number(id) },
    });

    if (sugestao?.imagemUrl?.includes("cloudinary.com")) {
      try {
        const parts = sugestao.imagemUrl.split("/");
        const fileWithExt = parts[parts.length - 1];
        const publicId = `raiz-conecta/sugestoes/${fileWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.log("Aviso: imagem não removida do Cloudinary.");
      }
    }

    await prisma.sugestao.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Apagado" });
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}