import { Platform } from "react-native";
import { SecureStoreSettingsStorage } from "./SecureStoreSettingsStorage";
import { createSettingsStore, type SettingsStore } from "./settings";
import { WebSettingsStorage } from "./WebSettingsStorage";

let instance: SettingsStore | null = null;

// Singleton: as configurações são as mesmas em todas as telas.
export function getSettingsStore(): SettingsStore {
  instance ??= createSettingsStore(
    Platform.OS === "web" ? new WebSettingsStorage(window.localStorage) : new SecureStoreSettingsStorage(),
  );
  return instance;
}

export { avatarFor, withAvatar } from "./settings";
export type { Settings } from "./settings";
