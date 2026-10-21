// A voz do app (o celular "fala" o que pesar). A tela só conhece este contrato; quem fala de verdade é o motor
// (expo-speech), o que deixa as regras testáveis sem som.

export interface SpeechEngine {
  speak(text: string, options: { language: string; rate: number }): void;
  stop(): void;
}

export interface Speaker {
  // Interrompe o que estiver falando e diz o texto.
  say(text: string): void;
  stop(): void;
}

const LANGUAGE = "pt-BR";
// Um pouco mais devagar que o normal: quem pesa está com as mãos ocupadas e precisa entender de primeira.
const RATE = 0.95;

export function createSpeaker(engine: SpeechEngine): Speaker {
  return {
    say(text) {
      try {
        engine.stop();
        engine.speak(text, { language: LANGUAGE, rate: RATE });
      } catch {
        // sem voz neste aparelho: a tela continua mostrando tudo
      }
    },
    stop() {
      try {
        engine.stop();
      } catch {
        // nada a parar
      }
    },
  };
}
