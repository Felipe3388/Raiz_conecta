export interface Settings {
  // Desliga deslizes e movimentos, além do que o aparelho já pede.
  reduceMotion: boolean;
  // Ícone que cada conta escolheu no lugar das iniciais (chave: e-mail em minúsculas).
  avatars: Record<string, string>;
}

export const DEFAULT_SETTINGS: Settings = { reduceMotion: false, avatars: {} };

const MAX_AVATAR_LENGTH = 16;

const avatarKey = (email: string) => email.trim().toLowerCase();

export function avatarFor(settings: Settings, email: string): string | null {
  return settings.avatars[avatarKey(email)] ?? null;
}

// Devolve novas configurações com o ícone da conta trocado; emoji nulo volta para as iniciais.
export function withAvatar(settings: Settings, email: string, emoji: string | null): Settings {
  const { [avatarKey(email)]: _removed, ...others } = settings.avatars;
  return { ...settings, avatars: emoji ? { ...others, [avatarKey(email)]: emoji } : others };
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings);
}

function parseAvatars(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const avatars: Record<string, string> = {};
  for (const [key, emoji] of Object.entries(value)) {
    if (typeof emoji === "string" && emoji.length > 0 && emoji.length <= MAX_AVATAR_LENGTH) avatars[key] = emoji;
  }
  return avatars;
}

// Texto salvo pode estar vazio ou estragado: qualquer dúvida volta ao padrão.
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return DEFAULT_SETTINGS;
    const { reduceMotion, avatars } = data as Record<string, unknown>;
    return {
      reduceMotion: typeof reduceMotion === "boolean" ? reduceMotion : DEFAULT_SETTINGS.reduceMotion,
      avatars: parseAvatars(avatars),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Onde as configurações ficam guardadas (aparelho ou navegador).
export interface SettingsStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}

type Listener = () => void;

export function createSettingsStore(storage: SettingsStorage) {
  let current = DEFAULT_SETTINGS;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    get: (): Settings => current,

    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async load(): Promise<void> {
      try {
        current = parseSettings(await storage.read());
        notify();
      } catch {
        // armazenamento indisponível: segue com o padrão
      }
    },

    async update(patch: Partial<Settings>): Promise<void> {
      current = { ...current, ...patch };
      notify();
      try {
        await storage.write(serializeSettings(current));
      } catch {
        // a escolha vale até fechar o app
      }
    },
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
