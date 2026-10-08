import * as SecureStore from "expo-secure-store";
import type { SettingsStorage } from "./settings";

const SETTINGS_KEY = "raiz-conecta.settings";

// Configurações no aparelho. Usa o mesmo cofre do token para não depender de outra biblioteca.
export class SecureStoreSettingsStorage implements SettingsStorage {
  read(): Promise<string | null> {
    return SecureStore.getItemAsync(SETTINGS_KEY);
  }

  write(value: string): Promise<void> {
    return SecureStore.setItemAsync(SETTINGS_KEY, value);
  }
}
