import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { hashSecret } from "@/lib/iot/secret";
import { GET } from "./route";

const SECRET = "k".repeat(64);
const headers = { "x-device-id": "a4cf129b07e1", authorization: `Device ${SECRET}` };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.findUnique.mockResolvedValue({ id: "b1", deviceId: "A4CF129B07E1", segredoHash: hashSecret(SECRET), emailProdutor: null });
});

describe("GET /api/iot/config", () => {
  it("entrega a hora do servidor e os intervalos de envio", async () => {
    const response = await GET(new Request("http://x/api/iot/config", { headers }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ vinculada: false, intervaloAtivoMs: 500, intervaloOciosoMs: 5000, lote: 10 });
    expect(Math.abs(body.hora - Date.now())).toBeLessThan(5000);
    expect(prismaMock.balanca.findUnique).toHaveBeenCalledWith({ where: { deviceId: "A4CF129B07E1" } });
  });

  it("exige a credencial do módulo", async () => {
    expect((await GET(new Request("http://x/api/iot/config"))).status).toBe(401);
    expect((await GET(new Request("http://x/api/iot/config", { headers: { ...headers, authorization: "Device x" } }))).status).toBe(401);
  });
});
