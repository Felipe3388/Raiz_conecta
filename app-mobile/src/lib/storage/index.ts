import { Platform } from "react-native";
import { SecureStoreTokenStorage } from "./SecureStoreTokenStorage";
import type { TokenStorage } from "./TokenStorage";
import { WebTokenStorage } from "./WebTokenStorage";

let instance: TokenStorage | null = null;

export function getTokenStorage(): TokenStorage {
  instance ??=
    Platform.OS === "web"
      ? new WebTokenStorage(window.localStorage)
      : new SecureStoreTokenStorage();
  return instance;
}

export type { TokenStorage };
