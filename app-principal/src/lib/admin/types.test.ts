import { describe, expect, it } from "vitest";
import { filterUsers, isPending, userName, type AdminUser } from "./types";

const user = (extra: Partial<AdminUser>): AdminUser => ({ email: "a@x.com", tipo: "produtor", status: "APROVADO", nomeFantasia: "Sítio Boa Vista", ...extra });
const users = [
  user({ email: "maria@x.com", nomeFantasia: "Sítio da Maria" }),
  user({ email: "mercado@x.com", tipo: "mercado", nomeFantasia: "Mercado Central", status: "SUSPENSO" }),
  user({ email: "novo@x.com", status: "EM_ANALISE", nomeFantasia: "Novo" }),
  user({ email: "adm@x.com", tipo: "admin", nomeFantasia: null }),
];

describe("filterUsers", () => {
  it("nunca mistura os pendentes na gestão", () => {
    expect(filterUsers(users, { query: "", kind: "todos", status: "todos" }).map((u) => u.email)).toEqual(["maria@x.com", "mercado@x.com", "adm@x.com"]);
  });
  it("busca por nome ou e-mail, sem diferenciar maiúsculas", () => {
    expect(filterUsers(users, { query: "MARIA", kind: "todos", status: "todos" })).toHaveLength(1);
    expect(filterUsers(users, { query: "central", kind: "todos", status: "todos" })).toHaveLength(1);
    expect(filterUsers(users, { query: " adm@ ", kind: "todos", status: "todos" })).toHaveLength(1);
  });
  it("filtra por tipo e por status", () => {
    expect(filterUsers(users, { query: "", kind: "mercado", status: "todos" })).toHaveLength(1);
    expect(filterUsers(users, { query: "", kind: "todos", status: "SUSPENSO" })[0].email).toBe("mercado@x.com");
    expect(filterUsers(users, { query: "", kind: "produtor", status: "SUSPENSO" })).toHaveLength(0);
  });
});

describe("userName / isPending", () => {
  it("cai para razão social e depois e-mail", () => {
    expect(userName({ email: "a@x.com", nomeFantasia: null, razaoSocial: "Razão Ltda" })).toBe("Razão Ltda");
    expect(userName({ email: "a@x.com", nomeFantasia: null })).toBe("a@x.com");
    expect(isPending(users[2])).toBe(true);
    expect(isPending(users[0])).toBe(false);
  });
});
