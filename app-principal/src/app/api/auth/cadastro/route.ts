import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const tipoUsuario    = formData.get("tipoUsuario")    as string;
    const nome           = formData.get("nome")           as string;
    const email          = formData.get("email")          as string;
    const senha          = formData.get("senha")          as string;
    const tipoDoc        = formData.get("tipoDoc")        as string;
    const documento      = formData.get("documento")      as string;
    const cep            = formData.get("cep")            as string;
    const rua            = formData.get("rua")            as string;
    const numero         = formData.get("numero")         as string;
    const bairro         = formData.get("bairro")         as string;
    const cidade         = formData.get("cidade")         as string;
    const estado         = formData.get("estado")         as string;
    const tipoComprovante = formData.get("tipoComprovante") as string;
    const file           = formData.get("file")           as File;

    if (!nome || !email || !senha || !tipoUsuario || !documento) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.acesso.findFirst({
      where: { login: email },
    });
    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 400 }
      );
    }

    // Upload para Cloudinary (persistente no Vercel)
    let urlDocumento = "";
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
      urlDocumento = result.secure_url;
    }

    const hashSenha = await bcrypt.hash(senha, 10);

    const dadosComuns = {
      nomeFantasia: nome,
      email,
      status: "EM_ANALISE",
      tipoDoc,
      documento,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      urlDocumento,
      Acessos: {
        create: {
          login: email,
          hash: hashSenha,
          tipoUser: tipoUsuario === "produtor" ? "produtor" : "mercado",
          status: "EM_ANALISE",
        },
      },
    };

    if (tipoUsuario === "produtor") {
      await prisma.vendedor.create({ data: dadosComuns });
    } else {
      await prisma.cliente.create({ data: dadosComuns });
    }

    // Microsserviço de e-mail — falha silenciosa (não quebra o cadastro)
    if (process.env.MICROSERVICE_URL) {
      try {
        await fetch(`${process.env.MICROSERVICE_URL}/api/email/boas-vindas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, nome, tipoUsuario }),
        });
      } catch (err) {
        console.error("Microsserviço de e-mail indisponível:", err);
      }
    }

    return NextResponse.json(
      { message: "Cadastro realizado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na API de Cadastro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar cadastrar." },
      { status: 500 }
    );
  }
}
