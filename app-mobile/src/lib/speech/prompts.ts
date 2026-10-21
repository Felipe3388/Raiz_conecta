import { formatKg } from "@/lib/format/weight";

// "1 quilo", "10 quilos", "9,88 quilos": como a voz lê o peso.
export function spokenKg(kg: number): string {
  if (kg === 1) return "1 quilo";
  return `${formatKg(kg).replace(" kg", "")} quilos`;
}

interface PromptInput {
  mercado: string;
  produto: string;
  expectedKg: number;
}

// O que o celular diz para cada produto da pesagem, sempre com o mercado (de quem é): "Empório São José. Coloque na
// balança 10 quilos de abacaxi."
export function weighPrompt({ mercado, produto, expectedKg }: PromptInput): string {
  return `${mercado}. Coloque na balança ${spokenKg(expectedKg)} de ${produto.toLowerCase()}.`;
}

// Na pausa entre pedidos: avisa que o pedido acabou e de quem é o próximo.
export function betweenPrompt(finishedMercado: string, nextMercado: string, seconds: number): string {
  return `Pedido de ${finishedMercado} concluído. Próximo pedido: ${nextMercado}. Começa em ${seconds} segundos.`;
}

export const RUN_FINISHED_PROMPT = "Pesagem concluída.";
