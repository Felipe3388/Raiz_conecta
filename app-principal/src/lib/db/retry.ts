// O Postgres desiste de uma transação serializável quando duas disputam os mesmos dados (erro P2034 do Prisma).
// Nesse caso basta tentar de novo: na segunda vez a conta já enxerga a oferta da outra pessoa.
export async function withSerializableRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const conflict = typeof error === "object" && error !== null && (error as { code?: string }).code === "P2034";
      if (!conflict || attempt >= attempts) throw error;
    }
  }
}
