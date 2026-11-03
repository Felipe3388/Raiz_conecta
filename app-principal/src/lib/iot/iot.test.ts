import { describe, expect, it } from "vitest";
import { formatDeviceId, isValidDeviceId, normalizeDeviceId } from "./deviceId";
import { linkKey } from "./linkKey";
import { cleanScaleName } from "./name";
import { ONLINE_WINDOW_MS, isOnline, parseReadings, readingsToStore } from "./readings";
import { CODE_LENGTH, codeMatches, formatCode, normalizeCode, pairingCode } from "./pairing";
import { generateSecret, hashSecret, secretMatches } from "./secret";
import { toScaleState } from "./scales";

describe("deviceId", () => {
  it("aceita as várias formas do mesmo MAC", () => {
    for (const form of ["a4:cf:12:9b:07:e1", "A4-CF-12-9B-07-E1", "a4cf129b07e1"]) {
      expect(normalizeDeviceId(form)).toBe("A4CF129B07E1");
      expect(isValidDeviceId(form)).toBe(true);
    }
    expect(formatDeviceId("a4cf129b07e1")).toBe("A4:CF:12:9B:07:E1");
  });
  it("recusa o que não é MAC", () => {
    expect(isValidDeviceId("A4CF129B07")).toBe(false);
    expect(isValidDeviceId("ZZCF129B07E1")).toBe(false);
    expect(isValidDeviceId("")).toBe(false);
  });
});

describe("secret", () => {
  it("gera segredos longos e diferentes; só o hash confere", () => {
    const a = generateSecret();
    expect(a).toHaveLength(64);
    expect(generateSecret()).not.toBe(a);
    expect(secretMatches(a, hashSecret(a))).toBe(true);
    expect(secretMatches(a + "x", hashSecret(a))).toBe(false);
    expect(secretMatches("", hashSecret(a))).toBe(false);
  });
  it("hash inválido nunca confere (sem estourar)", () => {
    expect(secretMatches("abc", "xyz")).toBe(false);
  });
});

describe("linkKey", () => {
  it("é estável para o par e diferente para outro produtor ou outra balança", () => {
    const key = linkKey("Maria@Teste.com", "a4:cf:12:9b:07:e1");
    expect(key).toMatch(/^RC-[0-9A-F]{20}$/);
    expect(linkKey("maria@teste.com", "A4CF129B07E1")).toBe(key);
    expect(linkKey("outra@teste.com", "A4CF129B07E1")).not.toBe(key);
    expect(linkKey("maria@teste.com", "A4CF129B07E2")).not.toBe(key);
  });
});

describe("cleanScaleName", () => {
  it("arruma o nome e volta ao original quando vazio", () => {
    expect(cleanScaleName("  Balança   do   galpão ")).toBe("Balança do galpão");
    expect(cleanScaleName("   ")).toBeNull();
    expect(cleanScaleName("x".repeat(50))).toHaveLength(30);
  });
});

describe("parseReadings", () => {
  const now = new Date("2026-10-27T12:00:00Z");

  it("aceita leituras, arredonda em gramas e ordena pelo tempo", () => {
    const result = parseReadings({ firmware: " 1.2.0 ", leituras: [{ kg: 2.34567, estavel: true, t: now.getTime() }, { kg: 1, t: now.getTime() - 1000 }] }, now);
    expect(result).toMatchObject({ ok: true, firmware: "1.2.0" });
    if (result.ok) {
      expect(result.leituras.map((r) => r.kg)).toEqual([1, 2.346]);
      expect(result.leituras.map((r) => r.estavel)).toEqual([false, true]);
    }
  });

  it("usa a hora do servidor se a do módulo estiver muito errada ou faltar", () => {
    const result = parseReadings({ leituras: [{ kg: 1, t: 1000 }, { kg: 2 }] }, now);
    if (!result.ok) throw new Error("devia aceitar");
    expect(result.leituras.every((r) => r.medidoEm.getTime() === now.getTime())).toBe(true);
  });

  it("ruído negativo da balança vazia vira zero", () => {
    const result = parseReadings({ leituras: [{ kg: -0.02 }] }, now);
    expect(result.ok && result.leituras[0].kg).toBe(0);
  });

  it("lista vazia vale como batimento", () => {
    expect(parseReadings({ leituras: [] }, now)).toMatchObject({ ok: true, leituras: [], firmware: null });
  });

  it.each([
    [null, "Envie um JSON com a lista de leituras."],
    [{}, "O campo leituras deve ser uma lista."],
    [{ leituras: [{ kg: "1" }] }, "Cada leitura precisa de kg numérico."],
    [{ leituras: [{ kg: 9999 }] }, "Peso fora do intervalo (0 a 500 kg)."],
    [{ leituras: [{ kg: -5 }] }, "Peso fora do intervalo (0 a 500 kg)."],
    [{ leituras: Array.from({ length: 51 }, () => ({ kg: 1 })) }, "Envie no máximo 50 leituras por vez."],
  ])("recusa %j", (body, error) => {
    expect(parseReadings(body, now)).toEqual({ ok: false, error });
  });
});

describe("isOnline", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  it("só vale se o módulo falou há pouco", () => {
    expect(isOnline(new Date(now.getTime() - ONLINE_WINDOW_MS), now)).toBe(true);
    expect(isOnline(new Date(now.getTime() - ONLINE_WINDOW_MS - 1), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });
});

describe("toScaleState", () => {
  const row = (deviceId: string, vinculadaEm: string, conectada: boolean) => ({
    deviceId, nome: `Balança ${deviceId.slice(-2)}`, apelido: null, vinculadaEm: new Date(vinculadaEm), emailProdutor: "maria@teste.com", conectada,
  });

  it("ordena por vínculo e marca a conectada", () => {
    const state = toScaleState([row("A4CF129B07E2", "2026-10-02T00:00:00Z", true), row("A4CF129B07E1", "2026-10-01T00:00:00Z", false)], "maria@teste.com");
    expect(state.scales.map((s) => s.deviceId)).toEqual(["A4:CF:12:9B:07:E1", "A4:CF:12:9B:07:E2"]);
    expect(state.activeDeviceId).toBe("A4:CF:12:9B:07:E2");
    expect(state.scales[0]).toMatchObject({ deviceName: "Balança E1", nickname: null, linkedAt: "2026-10-01T00:00:00.000Z" });
    expect(state.scales[0].key).toMatch(/^RC-/);
  });

  it("sem nenhuma conectada, activeDeviceId é null", () => {
    expect(toScaleState([row("A4CF129B07E1", "2026-10-01T00:00:00Z", false)], "maria@teste.com").activeDeviceId).toBeNull();
    expect(toScaleState([], "maria@teste.com")).toEqual({ scales: [], activeDeviceId: null });
  });
});

describe("pairing", () => {
  it("o código é estável, tem 8 símbolos legíveis e muda de balança para balança", () => {
    const code = pairingCode("a4:cf:12:9b:07:e1");
    expect(code).toMatch(new RegExp(`^[0-9A-HJKMNP-TV-Z]{${CODE_LENGTH}}$`));
    expect(pairingCode("A4CF129B07E1")).toBe(code);
    expect(pairingCode("A4CF129B07E2")).not.toBe(code);
    expect(formatCode(code)).toBe(`${code.slice(0, 4)}-${code.slice(4)}`);
  });
  it("aceita o código digitado com traço, minúsculas e letras confundidas", () => {
    const code = pairingCode("A4CF129B07E1");
    expect(codeMatches(formatCode(code).toLowerCase(), "A4CF129B07E1")).toBe(true);
    expect(codeMatches(` ${code} `, "A4CF129B07E1")).toBe(true);
    expect(codeMatches(code, "A4CF129B07E2")).toBe(false);
    expect(normalizeCode("o1-iL")).toBe("0111");
  });
});

describe("readingsToStore", () => {
  const at = (kg: number, estavel: boolean, s = 0) => ({ kg, estavel, medidoEm: new Date(2026, 9, 27, 12, 0, s) });
  const none = { kg: null, estavel: false };

  it("guarda só o peso que parou, uma vez", () => {
    const stored = readingsToStore([at(0.4, false, 0), at(1.2, true, 1), at(1.2, true, 2), at(1.201, true, 3), at(1.2, true, 4)], none);
    expect(stored.map((r) => r.kg)).toEqual([1.2]);
  });
  it("guarda de novo se o peso mudou ou se a balança foi esvaziada no meio", () => {
    expect(readingsToStore([at(1.2, true, 1), at(2.5, true, 2)], none).map((r) => r.kg)).toEqual([1.2, 2.5]);
    expect(readingsToStore([at(1.2, true, 1), at(0.5, false, 2), at(1.2, true, 3)], none).map((r) => r.kg)).toEqual([1.2, 1.2]);
  });
  it("não repete o último estável de uma chamada anterior e ignora balança vazia", () => {
    expect(readingsToStore([at(1.2, true)], { kg: 1.2, estavel: true })).toEqual([]);
    expect(readingsToStore([at(0, true)], none)).toEqual([]);
    expect(readingsToStore([at(1.2, true)], { kg: 1.2, estavel: false }).length).toBe(1);
  });
});
