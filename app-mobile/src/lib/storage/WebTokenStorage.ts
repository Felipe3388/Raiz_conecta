import type { TokenStorage } from "./TokenStorage";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TOKEN_KEY = "raiz-conecta.token";

// Alternativa ao SecureStore para o navegador, onde ele não existe.
// Se o navegador bloquear o armazenamento, o app segue funcionando, só sem lembrar a sessão.
export class WebTokenStorage implements TokenStorage {
  constructor(private readonly storage: KeyValueStorage) {}

  async get(): Promise<string | null> {
    try {
      return this.storage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async save(token: string): Promise<void> {
    try {
      this.storage.setItem(TOKEN_KEY, token);
    } catch {
      // armazenamento bloqueado: a sessão vale só até fechar o app
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.removeItem(TOKEN_KEY);
    } catch {
      // nada a limpar
    }
  }
}
