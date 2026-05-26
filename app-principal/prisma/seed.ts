import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o seed do banco de dados...");

  // Verifica se já existe algum admin
  const adminExistente = await prisma.acesso.findFirst({
    where: { tipoUser: "admin" },
  });

  if (!adminExistente) {
    const hashSenhaAdmin = await bcrypt.hash("Admin@123", 10);

    await prisma.acesso.create({
      data: {
        login: "admin@raizconecta.com.br", 
        hash: hashSenhaAdmin, // Senha: Admin@123
        tipoUser: "admin",
        status: "APROVADO",
      },
    });
    console.log("✅ Admin Mestre criado com sucesso!");
  } else {
    console.log("⚠️ O Admin Mestre já existe no banco. Pulando criação.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
