import * as Speech from "expo-speech";
import { createSpeaker, type Speaker } from "./speaker";

let speaker: Speaker | null = null;

// A voz do app, criada uma vez. O Expo Speech fala no celular e no navegador.
export function getSpeaker(): Speaker {
  speaker ??= createSpeaker({
    speak: (text, options) => Speech.speak(text, options),
    stop: () => void Speech.stop(),
  });
  return speaker;
}

export { betweenPrompt, RUN_FINISHED_PROMPT, spokenKg, weighPrompt } from "./prompts";
export type { Speaker } from "./speaker";
