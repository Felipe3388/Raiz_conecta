import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ oferta: { findUnique: vi.fn(), updateMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { PATCH } from "./route";

const ME = "mercado@teste.com";
const patch = (body: unknown, headers: Record<string, string> = authHeaders(ME, "mercado")) =>
  PATCH(new Request("http://x/api/mercado/avaliar", { method: "PATCH", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.oferta.findUnique.mockResolvedValue({ status: "ACEITA", statusEntrega: "PENDENTE", demanda: { emailMercado: ME } });
  prismaMock.oferta.updateMany.mockResolvedValue({ count: 1 });
});

describe("PATCH /api/mercado/avaliar", () => {
  it("confirma a entrega e grava a nota", async () => {
    const response = await patch({ ofertaId: "o1", nota: 4 });

    expect(response.status).toBe(200);
    expect(prismaMock.oferta.updateMany).toHaveBeenCalledWith({ where: { id: "o1", statusEntrega: { not: "ENTREGUE" } }, data: { statusEntrega: "ENTREGUE", nota: 4 } });
  });

  it("só mercado logado avalia", async () => {
    expect((await patch({ ofertaId: "o1", nota: 4 }, {})).status).toBe(401);
    expect((await patch({ ofertaId: "o1", nota: 4 }, authHeaders("p@x.com", "produtor"))).status).toBe(403);
  });

  it("não avalia oferta de pedido de outro mercado (responde como se não existisse)", async () => {
    prismaMock.oferta.findUnique.mockResolvedValue({ status: "ACEITA", statusEntrega: "PENDENTE", demanda: { emailMercado: "outro@x.com" } });
    expect((await patch({ ofertaId: "o1", nota: 5 })).status).toBe(404);
    expect(prismaMock.oferta.updateMany).not.toHaveBeenCalled();
  });

  it("valida a nota de 1 a 5 inteira", async () => {
    for (const nota of [0, 6, 2.5, "x"]) expect((await patch({ ofertaId: "o1", nota })).status).toBe(400);
    expect((await patch({ ofertaId: "o1" })).status).toBe(400);
  });

  it("não deixa avaliar duas vezes nem oferta cancelada", async () => {
    prismaMock.oferta.updateMany.mockResolvedValue({ count: 0 });
    expect((await patch({ ofertaId: "o1", nota: 5 })).status).toBe(409);

    prismaMock.oferta.findUnique.mockResolvedValue({ status: "CANCELADA", statusEntrega: "PENDENTE", demanda: { emailMercado: ME } });
    expect((await patch({ ofertaId: "o1", nota: 5 })).status).toBe(400);
  });
});
