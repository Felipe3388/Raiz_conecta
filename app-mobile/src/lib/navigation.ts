import { router } from "expo-router";

// Volta ao login fechando as telas empilhadas (cadastro, passo 2...), sem deixar login duplicado na pilha.
export function backToLogin(): void {
  if (router.canDismiss()) router.dismissAll();
  else router.replace("/login");
}
