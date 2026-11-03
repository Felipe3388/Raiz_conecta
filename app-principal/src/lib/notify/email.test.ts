import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ after: () => { throw new Error("fora de uma requisição"); } }));
import { notify, sendEmail } from "./email";

describe("e-mails", () => {
  beforeEach(() => {
    vi.stubEnv("MICROSERVICE_URL", "http://mail.local");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("não faz nada sem MICROSERVICE_URL", async () => {
    vi.stubEnv("MICROSERVICE_URL", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await sendEmail("aprovacao", { email: "a@b.com" });
    notify("aprovacao", { email: "a@b.com" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("chama o microsserviço com prazo e o corpo certo", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail("suspensao", { email: "a@b.com", motivo: "x" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://mail.local/api/email/suspensao");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ email: "a@b.com", motivo: "x" });
    expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("falha do microsserviço vira log, não erro", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fora do ar"));
    await expect(sendEmail("exclusao", { email: "a@b.com" })).resolves.toBeUndefined();
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({ event: "email.exclusao.falhou" });
  });

  it("notify dispara mesmo fora de uma requisição", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    notify("aprovacao", { email: "a@b.com" });
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
