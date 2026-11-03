import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  demanda: { findUnique: vi.fn(), update: vi.fn() },
  oferta: { updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { PATCH } from "./route";

const ME = "mercado@teste.com";
const patch = (body: unknown, headers: Record<string, string> = authHeaders(ME, "mercado")) =>
  PATCH(new Request("http://x/api/mercado/cancelar", { method: "PATCH", headers, body: JSON.stringify(body) }));

const demanda = (over: Record<string, unknown> = {}) => ({
  id: "d1", emailMercado: ME, status: "ABERTA", criadoEm: new Date("2026-10-26T10:00:00Z"), ofertas: [], ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T12:00:00Z")); // 2 dias úteis depois
  prismaMock.demanda.findUnique.mockResolvedValue(demanda());
  prismaMock.$transaction.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

describe("PATCH /api/mercado/cancelar", () => {
  it("cancela o pedido e as ofertas dele na mesma transação", async () => {
    const response = await patch({ demandaId: "d1" });

    expect(response.status).toBe(200);
    expect(prismaMock.oferta.updateMany).toHaveBeenCalledWith({ where: { demandaId: "d1" }, data: { status: "CANCELADA" } });
    expect(prismaMock.demanda.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { status: "CANCELADA" } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("só mercado logado, e só o dono do pedido (outro vê 404)", async () => {
    expect((await patch({ demandaId: "d1" }, {})).status).toBe(401);
    expect((await patch({ demandaId: "d1" }, authHeaders("p@x.com", "produtor"))).status).toBe(403);
    expect((await patch({ demandaId: "d1" }, authHeaders("outro@x.com", "mercado"))).status).toBe(404);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("recusa o e-mail de outro mercado no corpo", async () => {
    expect((await patch({ demandaId: "d1", emailMercado: "outro@x.com" })).status).toBe(403);
  });

  it("depois de 7 dias úteis responde 422 com os dias, para a tela explicar", async () => {
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
    const response = await patch({ demandaId: "d1" });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data).toMatchObject({ prazoExpirado: true, diasPassados: 11, prazoMaximo: 7 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("não cancela pedido já cancelado, concluído ou com entrega confirmada", async () => {
    for (const over of [{ status: "CANCELADA" }, { status: "CONCLUIDA" }, { ofertas: [{ statusEntrega: "ENTREGUE" }] }]) {
      prismaMock.demanda.findUnique.mockResolvedValue(demanda(over));
      expect((await patch({ demandaId: "d1" })).status).toBe(400);
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("pede o código do pedido e responde 404 se ele não existe", async () => {
    expect((await patch({})).status).toBe(400);
    prismaMock.demanda.findUnique.mockResolvedValue(null);
    expect((await patch({ demandaId: "zzz" })).status).toBe(404);
  });
});
