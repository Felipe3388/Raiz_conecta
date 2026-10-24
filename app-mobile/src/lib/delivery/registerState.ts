import type { WeightVerdict } from "./weight";

// O estado do botão de registrar o peso. Diz o que ele mostra e se pode ser tocado:
// - empty: nada para registrar ainda (balança vazia ou nada digitado);
// - irregular: o peso na balança ainda oscila (laranja, bloqueado);
// - holding: o peso parou e a contagem de 5 s está rodando (bloqueado);
// - below: o total ficaria abaixo do mínimo (laranja, bloqueado);
// - above: o total passaria do pedido, acima do máximo aceito (vermelho, bloqueado);
// - ready: dentro da faixa, pode registrar (verde).
export type RegisterState = "empty" | "irregular" | "holding" | "below" | "above" | "ready";

interface RegisterStateInput {
  // Há um peso para registrar (estável na balança ou digitado).
  hasWeight: boolean;
  // Só para a balança: o peso oscila e a contagem de 5 s ainda não acabou.
  irregular: boolean;
  holding: boolean;
  // Como fica o produto com este peso somado ao que já foi registrado.
  verdict: WeightVerdict;
}

export function registerState({ hasWeight, irregular, holding, verdict }: RegisterStateInput): RegisterState {
  if (irregular) return "irregular";
  if (!hasWeight) return "empty";
  if (holding) return "holding";
  if (verdict === "ABAIXO") return "below";
  if (verdict === "ACIMA") return "above";
  return "ready";
}

// Só o estado "pronto" deixa registrar.
export function canRegister(state: RegisterState): boolean {
  return state === "ready";
}
