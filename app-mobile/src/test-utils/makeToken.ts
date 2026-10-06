// Gera um JWT fake (sem assinatura válida) para testes de decodificação.
function encodeBase64Url(value: object): string {
  const utf8 = unescape(encodeURIComponent(JSON.stringify(value)));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function makeToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  return `${encodeBase64Url(header)}.${encodeBase64Url(payload)}.assinatura`;
}
