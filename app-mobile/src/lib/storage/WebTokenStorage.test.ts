import { WebTokenStorage, type KeyValueStorage } from "./WebTokenStorage";

function createFakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("WebTokenStorage", () => {
  it("guarda, lê e limpa o token", async () => {
    const storage = new WebTokenStorage(createFakeStorage());

    expect(await storage.get()).toBeNull();

    await storage.save("abc");
    expect(await storage.get()).toBe("abc");

    await storage.clear();
    expect(await storage.get()).toBeNull();
  });

  it("usa a mesma chave do armazenamento seguro", async () => {
    const fake = createFakeStorage();

    await new WebTokenStorage(fake).save("abc");

    expect(fake.data.get("raiz-conecta.token")).toBe("abc");
  });

  it("não quebra quando o navegador bloqueia o armazenamento", async () => {
    const blocked: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const storage = new WebTokenStorage(blocked);

    expect(await storage.get()).toBeNull();
    await expect(storage.save("abc")).resolves.toBeUndefined();
    await expect(storage.clear()).resolves.toBeUndefined();
  });
});
