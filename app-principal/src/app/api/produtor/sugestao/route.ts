import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import path from "path";

// 1. ADMIN LÊ AS SUGESTÕES
export async function GET() {
  try {
    const sugestoes = await prisma.sugestao.findMany({ orderBy: { criadoEm: 'desc' } });
    return NextResponse.json(sugestoes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

// 2. PRODUTOR CRIA A SUGESTÃO E DISPARA O E-MAIL
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const emailProdutor = formData.get("emailProdutor") as string;
    const nomeProduto = formData.get("nomeProduto") as string;
    const descricao = formData.get("descricao") as string;
    const file = formData.get("file") as File;

    let imagemUrl = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const nomeArquivo = `sugestao_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const caminhoDestino = path.join(process.cwd(), "public/uploads/produtos", nomeArquivo);
      await writeFile(caminhoDestino, buffer);
      imagemUrl = `/uploads/produtos/${nomeArquivo}`;
    }

    // Salva no banco de dados para aparecer na tela do Admin
    await prisma.sugestao.create({
      data: { emailProdutor, nomeProduto, descricao, imagemUrl }
    });

    // Dispara a requisição para o Microsserviço enviar o e-mail
    try {
      await fetch("http://localhost:3001/api/email/sugestao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailProdutor, nomeProduto, descricao })
      });
    } catch (e) {
      console.error("Microsserviço de e-mail parece estar desligado.");
    }

    return NextResponse.json({ message: "Enviado com sucesso!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// 3. ADMIN APAGA A SUGESTÃO DEPOIS DE LER
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const sugestao = await prisma.sugestao.findUnique({ where: { id: Number(id) } });
    if (sugestao?.imagemUrl) {
      try { await unlink(path.join(process.cwd(), "public", sugestao.imagemUrl)); } catch(e) {}
    }

    await prisma.sugestao.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Apagado" });
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}