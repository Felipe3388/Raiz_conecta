import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Devolve os dados do produtor para montar a tela
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email)
      return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });

    const produtor = await prisma.vendedor.findFirst({ where: { email } });
    return NextResponse.json(produtor);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
  }
}

// POST: Recebe a foto/documento, sobe para o Cloudinary e atualiza o BD
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const file  = formData.get("file")  as File;

    if (!email || !file) {
      return NextResponse.json(
        { error: "Dados ou arquivo faltando" },
        { status: 400 }
      );
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "raiz-conecta/docs", resource_type: "auto" },
          (error, res) => {
            if (error || !res) return reject(error);
            resolve(res as { secure_url: string });
          }
        )
        .end(buffer);
    });

    await prisma.vendedor.updateMany({
      where: { email },
      data: {
        status: "EM_ANALISE",
        urlDocumento: result.secure_url,
      },
    });

    return NextResponse.json({ message: "Documento enviado com sucesso!" });
  } catch (error) {
    console.error("Erro no Upload:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar arquivo" },
      { status: 500 }
    );
  }
}
