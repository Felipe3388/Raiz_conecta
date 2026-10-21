import { createSpeaker, type SpeechEngine } from "./speaker";

function fakeEngine() {
  const calls: string[] = [];
  const engine: SpeechEngine = {
    speak: (text, options) => calls.push(`speak:${text}:${options.language}:${options.rate}`),
    stop: () => calls.push("stop"),
  };
  return { engine, calls };
}

describe("createSpeaker", () => {
  it("interrompe o que falava e diz o texto novo, em português", () => {
    const { engine, calls } = fakeEngine();
    createSpeaker(engine).say("Coloque na balança 10 quilos de abacaxi.");
    expect(calls).toEqual(["stop", "speak:Coloque na balança 10 quilos de abacaxi.:pt-BR:0.95"]);
  });

  it("para a voz", () => {
    const { engine, calls } = fakeEngine();
    createSpeaker(engine).stop();
    expect(calls).toEqual(["stop"]);
  });

  it("um motor que falha não derruba a tela", () => {
    const speaker = createSpeaker({
      speak: () => {
        throw new Error("sem voz");
      },
      stop: () => {
        throw new Error("sem voz");
      },
    });
    expect(() => speaker.say("oi")).not.toThrow();
    expect(() => speaker.stop()).not.toThrow();
  });
});
