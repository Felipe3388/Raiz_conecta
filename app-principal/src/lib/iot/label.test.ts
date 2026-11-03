import { describe, expect, it } from "vitest";
import { isActiveScale, labelError, maskDeviceId, maskPairingCode, parseLabelText, scaleDisplayName, scaleRowHint } from "./label";
import { applyReading, formatKg, POLL_OFFLINE_MS, POLL_ONLINE_MS } from "./liveWeight";

describe("etiqueta da balança", () => {
  it("mascara o endereço e o código enquanto a pessoa digita", () => {
    expect(maskDeviceId("a4cf129")).toBe("A4:CF:12:9");
    expect(maskDeviceId("A4-CF-12-9B-07-E1-FF")).toBe("A4:CF:12:9B:07:E1");
    expect(maskPairingCode("k7m2q9xt")).toBe("K7M2-Q9XT");
    expect(maskPairingCode("k7m")).toBe("K7M");
  });

  it("lê o texto do QR Code e recusa o que não é da etiqueta", () => {
    expect(parseLabelText(" RC:A4CF129B07E1:K7M2Q9XT ")).toEqual({ deviceId: "A4:CF:12:9B:07:E1", code: "K7M2-Q9XT" });
    expect(parseLabelText("RC:A4CF12:K7M2Q9XT")).toBeNull();
    expect(parseLabelText("A4:CF:12:9B:07:E1")).toBeNull();
  });

  it("confere os dois campos antes de enviar", () => {
    expect(labelError("A4:CF:12", "K7M2-Q9XT")).toMatch(/endereço completo/);
    expect(labelError("A4:CF:12:9B:07:E1", "K7M2")).toMatch(/código da etiqueta/);
    expect(labelError("A4:CF:12:9B:07:E1", "K7M2-Q9XT")).toBeNull();
  });

  it("nome, balança conectada e a linha do Mais", () => {
    const scale = { deviceId: "A4:CF:12:9B:07:E1", deviceName: "Balança RC-07E1", nickname: null, key: "k", linkedAt: "" };
    expect(scaleDisplayName(scale)).toBe("Balança RC-07E1");
    expect(scaleDisplayName({ ...scale, nickname: "Galpão" })).toBe("Galpão");
    expect(isActiveScale({ scales: [scale], activeDeviceId: "a4cf129b07e1" }, scale)).toBe(true);
    expect(isActiveScale({ scales: [scale], activeDeviceId: null }, scale)).toBe(false);
    expect(scaleRowHint("Galpão", 2)).toBe("Conectada: Galpão");
    expect(scaleRowHint(null, 2)).toMatch(/Nenhuma conectada/);
    expect(scaleRowHint(null, 0)).toMatch(/Não conectada/);
  });
});

describe("peso ao vivo", () => {
  it("com sinal mostra o peso e pergunta de novo em 0,5 s", () => {
    expect(applyReading({ online: true, kg: 12.35, estavel: true, em: 10, agora: 12 })).toEqual({
      weight: { status: "online", kg: 12.35, stable: true, measuredAt: 10, serverNow: 12 },
      nextInMs: POLL_ONLINE_MS,
    });
  });

  it("sem sinal, sem peso ou com erro fica 'sem sinal' e pergunta a cada 2 s", () => {
    expect(applyReading(null)).toMatchObject({ weight: { status: "offline", kg: null }, nextInMs: POLL_OFFLINE_MS });
    expect(applyReading({ online: false, kg: null, estavel: false, em: 5, agora: 99 })).toMatchObject({ weight: { status: "offline", measuredAt: 5 } });
    expect(applyReading({ online: true, kg: null, estavel: false, em: null, agora: 1 }).weight.status).toBe("offline");
  });

  it("formata o peso em kg", () => {
    expect(formatKg(12.35)).toBe("12,35 kg");
    expect(formatKg(0.45)).toBe("0,450 kg");
    expect(formatKg(0)).toBe("0,00 kg");
  });
});
