import type { KeyValueStorage } from "@/lib/storage/WebTokenStorage";
import type { SettingsStorage } from "./settings";

const SETTINGS_KEY = "raiz-conecta.settings";

// Configurações no armazenamento do navegador.
export class WebSettingsStorage implements SettingsStorage {
  constructor(private readonly storage: KeyValueStorage) {}

  async read(): Promise<string | null> {
    return this.storage.getItem(SETTINGS_KEY);
  }

  async write(value: string): Promise<void> {
    this.storage.setItem(SETTINGS_KEY, value);
  }
}
