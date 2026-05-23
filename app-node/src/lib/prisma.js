const { PrismaClient } = require("@prisma/client");

// Previne múltiplas instâncias do Prisma Client no ambiente de desenvolvimento
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
