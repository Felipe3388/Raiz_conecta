import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const email           = formData.get("email")           as string;
    const tipoUsuario     = formData.get("tipoUsuario")     as string;
    const tipoDoc         = formData.get("tipoDoc")         as string;
    const documento       = formData.get("documento")       as string;
    const cep             = formData.get("cep")             as string;
    const rua             = formData.get("rua")             as string;
    const numero          = formData.get("numero")          as string;
    const bairro          = formData.get("bairro")          as string;
    const cidade          = formData.get("cidade")          as string;
    const estado          = formData.get("estado")          as string;
    const tipoComprovante = formData.get("tipoComprovante") as string;
    const file            = formData.get("file")            as File;

    if (!email || !tipoUsuario || !documento || !cep) {
      return NextResponse.json(
        { error: "Dados obrigatórios incompletos." },
        { status: 400 }
      );
    }

    let urlDocumentoReal: string | null = null;

    if (file && file.size > 0) {
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
      urlDocumentoReal = result.secure_url;
    }

    const dadosAtualizados = {
      tipoDoc,
      documento,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      status: "EM_ANALISE",
      ...(urlDocumentoReal && { urlDocumento: urlDocumentoReal }),
    };

    if (tipoUsuario === "produtor") {
      await prisma.vendedor.update({ where: { email }, data: dadosAtualizados });
      await prisma.acesso.updateMany({ where: { login: email }, data: { status: "EM_ANALISE" } });
    } else if (tipoUsuario === "mercado") {
      await prisma.cliente.update({ where: { email }, data: dadosAtualizados });
      await prisma.acesso.updateMany({ where: { login: email }, data: { status: "EM_ANALISE" } });
    }

    return NextResponse.json({ message: "Perfil atualizado com sucesso!" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro interno ao salvar dados." }, { status: 500 });
  }
}
