import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, prismaCode, serverError, text } from "@/lib/api/http";
import { DOCUMENT_TYPES, checkFile, optionalFile, uploadFile } from "@/lib/media/upload";
import { notify } from "@/lib/notify/email";
import { digits, validateCadastro, type AccountType } from "@/lib/validation/cadastro";

// Cadastro de produtor ou mercado (site e app). Cria o perfil e o acesso juntos, já "em análise", com a foto do
// documento. Esta rota é aberta (ainda não há login), então valida tudo e não confia em nada do corpo.
export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail(400, "Envie os dados do cadastro.");

    const fields = {
      tipoUsuario: text(form.get("tipoUsuario")),
      nome: text(form.get("nome")),
      email: text(form.get("email")).toLowerCase(),
      senha: typeof form.get("senha") === "string" ? (form.get("senha") as string) : "",
      telefone: text(form.get("telefone")),
      tipoDoc: text(form.get("tipoDoc")),
      documento: text(form.get("documento")),
      cep: text(form.get("cep")),
      rua: text(form.get("rua")),
      numero: text(form.get("numero")),
      bairro: text(form.get("bairro")),
      cidade: text(form.get("cidade")),
      estado: text(form.get("estado")).toUpperCase(),
    };

    const problem = validateCadastro(fields);
    if (problem) return fail(400, problem);

    const file = optionalFile(form.get("file"));
    if (!file) return fail(400, "Anexe a foto do seu documento para validação.");
    const fileProblem = checkFile(file, DOCUMENT_TYPES);
    if (fileProblem) return fail(400, fileProblem);

    const existing = await prisma.acesso.findFirst({ where: { login: { equals: fields.email, mode: "insensitive" } } });
    if (existing) return fail(409, "Este e-mail já está cadastrado.");

    const urlDocumento = await uploadFile(file, "docs", "auto");
    const hash = await bcrypt.hash(fields.senha, 10);
    const tipoUsuario = fields.tipoUsuario as AccountType;

    const data = {
      nomeFantasia: fields.nome,
      email: fields.email,
      status: "EM_ANALISE",
      tipoDoc: fields.tipoDoc,
      documento: digits(fields.documento),
      telefone: fields.telefone || null,
      cep: digits(fields.cep),
      rua: fields.rua,
      numero: fields.numero,
      bairro: fields.bairro,
      cidade: fields.cidade,
      estado: fields.estado,
      urlDocumento,
      Acessos: { create: { login: fields.email, hash, tipoUser: tipoUsuario, status: "EM_ANALISE" } },
    };

    if (tipoUsuario === "produtor") await prisma.vendedor.create({ data });
    else await prisma.cliente.create({ data });

    notify("boas-vindas", { email: fields.email, nome: fields.nome, tipoUsuario });
    return NextResponse.json({ message: "Cadastro realizado com sucesso!" }, { status: 201 });
  } catch (error) {
    // Dois cadastros ao mesmo tempo com o mesmo e-mail: o banco barra o segundo.
    if (prismaCode(error) === "P2002") return fail(409, "Este e-mail já está cadastrado.");
    return serverError("auth.cadastro.falhou", error, "Erro interno no servidor ao tentar cadastrar.");
  }
}
