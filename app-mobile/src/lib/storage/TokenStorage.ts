export interface TokenStorage {
  get(): Promise<string | null>;
  save(token: string): Promise<void>;
  clear(): Promise<void>;
}
