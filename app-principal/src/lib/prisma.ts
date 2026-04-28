import { PrismaClient } from "@prisma/client";

// Previne múltiplas instâncias do Prisma Client no ambiente de desenvolvimento (Hot Reload do Next.js)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
