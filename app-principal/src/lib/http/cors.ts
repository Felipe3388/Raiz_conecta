// CORS da API. O app mobile no navegador (Expo Web) chama a API de outra origem; o app nativo nem usa CORS.
// A API aceita o token no cabeçalho Authorization (não depende de cookie), então liberar a origem é seguro.
// Defina CORS_ALLOWED_ORIGIN (ex.: http://localhost:8081) para aceitar só essa origem; sem a variável vale qualquer uma.
export function corsHeaders(allowedOrigin: string | undefined): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin?.trim() || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}
