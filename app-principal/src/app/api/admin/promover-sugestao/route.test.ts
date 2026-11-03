import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  sugestao: { findUnique: vi.fn(), delete: vi.fn() },
  produto: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { POST } from "./route";

const ADMIN = authHeaders("admin@x.com", "admin");
const post = (body: unknown, headers: Record<string, string> = ADMIN) =>
  POST(new Request("http://x/api/admin/promover-sugestao", { method: "POST", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockResolvedValue([]);
  prismaMock.sugestao.findUnique.mockResolvedValue({ id: 3, nomeProduto: "Pitaya", descricao: "Vermelha", precoSugerido: 12, imagemUrl: "https://img/x.jpg" });
});

describe("POST /api/admin/promover-sugestao", () => {
  it("só o admin promove", async () => {
    expect((await post({ idSugestao: 3 }, {})).status).toBe(401);
    expect((await post({ idSugestao: 3 }, authHeaders("p@x.com", "produtor"))).status).toBe(403);
  });

  it("cria o produto e apaga a sugestão na mesma transação, usando o que a sugestão trouxe", async () => {
    const response = await post({ idSugestao: 3, tipo: "Frutas" });

    expect(response.status).toBe(200);
    expect(prismaMock.produto.create).toHaveBeenCalledWith({
      data: { nome: "Pitaya", tipo: "Frutas", preco: 12, unidadePadrao: "Kg", descricao: "Vermelha", imagemUrl: "https://img/x.jpg", status: "ATIVO" },
    });
    expect(prismaMock.sugestao.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("os ajustes do modal valem mais que a sugestão", async () => {
    await post({ idSugestao: 3, nome: "Pitaya Vermelha", tipo: "Frutas", preco: "9,5", unidadePadrao: "Caixa" });
    expect(prismaMock.produto.create.mock.calls[0][0].data).toMatchObject({ nome: "Pitaya Vermelha", preco: 9.5, unidadePadrao: "Caixa" });
  });

  it("recusa id ruim, sugestão que não existe e preço inválido", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ idSugestao: 3, preco: "0" })).status).toBe(400);
    prismaMock.sugestao.findUnique.mockResolvedValue(null);
    expect((await post({ idSugestao: 9 })).status).toBe(404);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
