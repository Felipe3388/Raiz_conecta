import { clearLegacySession } from "./client";

// Sai da conta: apaga o cookie no servidor, limpa restos de versões antigas e avisa a barra do topo.
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // sem rede o cookie vence sozinho (2 h)
  }
  clearLegacySession(localStorage);
  window.dispatchEvent(new Event("loginStateChange"));
}
