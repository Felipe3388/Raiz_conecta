import { WebSettingsStorage } from "./WebSettingsStorage";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("WebSettingsStorage", () => {
  it("começa sem nada salvo", async () => {
    expect(await new WebSettingsStorage(fakeStorage()).read()).toBeNull();
  });

  it("grava e lê de volta", async () => {
    const storage = new WebSettingsStorage(fakeStorage());

    await storage.write('{"reduceMotion":true}');

    expect(await storage.read()).toBe('{"reduceMotion":true}');
  });
});
