export interface TextSegment {
  text: string;
  bold: boolean;
}

// Texto com **negrito** vira uma lista de trechos, para renderizar sem depender de HTML.
export function splitBold(text: string): TextSegment[] {
  return text
    .split("**")
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text !== "");
}
