export interface Env {
  apiUrl: string;
  // Quando verdadeiro, o app usa dados simulados e não precisa da API.
  useMocks: boolean;
}

interface RawEnv {
  apiUrl: string | undefined;
  useMocks?: string | undefined;
}

export function parseEnv(raw: RawEnv): Env {
  const useMocks = raw.useMocks?.trim().toLowerCase() === "true";
  const apiUrl = raw.apiUrl?.trim();

  if (useMocks) return { apiUrl: apiUrl ?? "", useMocks };

  if (!apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env.",
    );
  }
  if (!/^https?:\/\//.test(apiUrl)) {
    throw new Error("EXPO_PUBLIC_API_URL deve começar com http:// ou https://.");
  }

  return { apiUrl: apiUrl.replace(/\/+$/, ""), useMocks };
}

// O Expo só injeta variáveis referenciadas de forma estática em process.env.
export const env: Env = parseEnv({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS,
});
