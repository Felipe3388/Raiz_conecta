import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "./TokenStorage";

const TOKEN_KEY = "raiz-conecta.token";

export class SecureStoreTokenStorage implements TokenStorage {
  get(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  save(token: string): Promise<void> {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}
