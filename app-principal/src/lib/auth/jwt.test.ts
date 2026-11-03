import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { getJwtSecret, resolveJwtSecret, verifyToken } from "./jwt";

const SECRET = "segredo-de-teste";
const base = { email: "maria@teste.com", role: "produtor", nome: "Sítio São João", status: "APROVADO" };

describe("verifyToken", () => {
  it("lê um token válido criado pelo login (jsonwebtoken)", async () => {
    const token = jwt.sign(base, SECRET, { expiresIn: "2h" });
    expect(await verifyToken(token, SECRET)).toEqual(base);
  });

  it("preserva acentos no nome", async () => {
    const token = jwt.sign({ ...base, nome: "Horta da Conceição" }, SECRET);
    expect((await verifyToken(token, SECRET))?.nome).toBe("Horta da Conceição");
  });

  it("recusa assinatura de outro segredo", async () => {
    const token = jwt.sign(base, "outro-segredo");
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it("recusa token adulterado (perfil trocado no corpo)", async () => {
    const token = jwt.sign(base, SECRET);
    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...base, role: "admin" })).toString("base64url");
    expect(await verifyToken(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
  });

  it("recusa token expirado", async () => {
    const token = jwt.sign(base, SECRET, { expiresIn: -10 });
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it("recusa alg none e outros algoritmos", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(base)).toString("base64url");
    expect(await verifyToken(`${header}.${payload}.`, SECRET)).toBeNull();
    expect(await verifyToken(jwt.sign(base, SECRET, { algorithm: "HS512" }), SECRET)).toBeNull();
  });

  it("recusa perfil desconhecido, lixo e texto vazio", async () => {
    expect(await verifyToken(jwt.sign({ ...base, role: "root" }, SECRET), SECRET)).toBeNull();
    expect(await verifyToken("lixo", SECRET)).toBeNull();
    expect(await verifyToken("", SECRET)).toBeNull();
    expect(await verifyToken("a.b.c", SECRET)).toBeNull();
  });
});

describe("getJwtSecret", () => {
  it("usa JWT_SECRET quando existe", () => {
    const before = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "do-ambiente";
    expect(getJwtSecret()).toBe("do-ambiente");
    if (before === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = before;
  });
});

describe("resolveJwtSecret", () => {
  it("usa a variável quando ela existe", () => {
    expect(resolveJwtSecret({ JWT_SECRET: " abc ", NODE_ENV: "production" })).toBe("abc");
  });

  it("em desenvolvimento e teste cai no valor fixo de desenvolvimento", () => {
    const dev = resolveJwtSecret({ NODE_ENV: "development" });
    expect(dev).toBeTruthy();
    expect(resolveJwtSecret({ NODE_ENV: "test" })).toBe(dev);
    expect(resolveJwtSecret({})).toBe(dev);
  });

  it("em produção sem JWT_SECRET recusa (falha fechada), também com a variável vazia", () => {
    expect(() => resolveJwtSecret({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
    expect(() => resolveJwtSecret({ NODE_ENV: "production", JWT_SECRET: "  " })).toThrow(/JWT_SECRET/);
  });
});
