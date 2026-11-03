import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it } from "vitest";
import { getJwtSecret } from "./jwt";
import { emailMatches, getSession, requireSession, tokenFromRequest } from "./session";

const payload = { email: "maria@teste.com", role: "produtor", nome: "Maria", status: "APROVADO" };
let token: string;

beforeEach(() => {
  token = jwt.sign(payload, getJwtSecret(), { expiresIn: "2h" });
});

const request = (headers: Record<string, string>) => new Request("http://localhost/api/x", { headers });

describe("tokenFromRequest", () => {
  it("lê o Bearer do app", () => {
    expect(tokenFromRequest(request({ authorization: "Bearer abc.def.ghi" }))).toBe("abc.def.ghi");
    expect(tokenFromRequest(request({ authorization: "bearer abc" }))).toBe("abc");
  });

  it("lê o cookie do site", () => {
    expect(tokenFromRequest(request({ cookie: "outro=1; token=abc.def.ghi; x=2" }))).toBe("abc.def.ghi");
  });

  it("sem nada, devolve null", () => {
    expect(tokenFromRequest(request({}))).toBeNull();
    expect(tokenFromRequest(request({ authorization: "Basic abc" }))).toBeNull();
  });
});

describe("requireSession", () => {
  it("401 sem token", async () => {
    const result = await requireSession(request({}));
    expect(result.error?.status).toBe(401);
  });

  it("401 com token falso", async () => {
    const result = await requireSession(request({ authorization: "Bearer x.y.z" }));
    expect(result.error?.status).toBe(401);
  });

  it("403 para outro perfil", async () => {
    const result = await requireSession(request({ authorization: `Bearer ${token}` }), ["mercado"]);
    expect(result.error?.status).toBe(403);
  });

  it("libera o perfil certo, por Bearer ou cookie", async () => {
    const bearer = await requireSession(request({ authorization: `Bearer ${token}` }), ["produtor"]);
    expect(bearer.session?.email).toBe("maria@teste.com");
    const cookie = await requireSession(request({ cookie: `token=${token}` }), ["produtor"]);
    expect(cookie.session?.role).toBe("produtor");
  });
});

describe("getSession / emailMatches", () => {
  it("getSession devolve null sem token válido", async () => {
    expect(await getSession(request({}))).toBeNull();
  });

  it("o e-mail informado precisa ser o da sessão (ou vir vazio)", async () => {
    const session = (await getSession(request({ authorization: `Bearer ${token}` })))!;
    expect(emailMatches(session, undefined)).toBe(true);
    expect(emailMatches(session, "MARIA@teste.com")).toBe(true);
    expect(emailMatches(session, "outra@teste.com")).toBe(false);
  });
});
