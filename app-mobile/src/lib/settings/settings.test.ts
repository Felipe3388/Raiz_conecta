import {
  avatarFor,
  createSettingsStore,
  DEFAULT_SETTINGS,
  parseSettings,
  serializeSettings,
  withAvatar,
  type SettingsStorage,
} from "./settings";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  const storage: SettingsStorage & { value: () => string | null } = {
    read: async () => value,
    write: async (next) => {
      value = next;
    },
    value: () => value,
  };
  return storage;
}

describe("parseSettings", () => {
  it("sem nada salvo, usa o padrão", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("lê o que foi salvo", () => {
    const saved = { reduceMotion: true, avatars: { "ana@sitio.com": "🍅" } };
    expect(parseSettings(serializeSettings(saved))).toEqual(saved);
  });

  it.each(["", "não é json", "[]", "null", '{"reduceMotion":"sim"}', "123"])(
    "texto estragado %p volta ao padrão",
    (raw) => {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    },
  );

  it("settings antigas, sem ícones, continuam valendo", () => {
    expect(parseSettings('{"reduceMotion":true}')).toEqual({ reduceMotion: true, avatars: {} });
  });

  it("ignora ícones estragados e guarda só os válidos", () => {
    const raw = JSON.stringify({ reduceMotion: false, avatars: { "a@a.com": "🌱", "b@b.com": 7, "c@c.com": "" } });
    expect(parseSettings(raw).avatars).toEqual({ "a@a.com": "🌱" });
    expect(parseSettings('{"avatars":[1,2]}').avatars).toEqual({});
    expect(parseSettings('{"avatars":"x"}').avatars).toEqual({});
  });
});

describe("ícone da conta", () => {
  it("avatarFor não diferencia maiúsculas nem espaços no e-mail", () => {
    const settings = withAvatar(DEFAULT_SETTINGS, " Ana@Sitio.com ", "🍅");
    expect(avatarFor(settings, "ana@sitio.com")).toBe("🍅");
    expect(avatarFor(settings, "ANA@SITIO.COM ")).toBe("🍅");
  });

  it("quem não escolheu não tem ícone", () => {
    expect(avatarFor(DEFAULT_SETTINGS, "ana@sitio.com")).toBeNull();
  });

  it("cada conta guarda o seu e as outras não mudam", () => {
    const first = withAvatar(DEFAULT_SETTINGS, "ana@sitio.com", "🍅");
    const second = withAvatar(first, "bia@sitio.com", "🌽");
    expect(avatarFor(second, "ana@sitio.com")).toBe("🍅");
    expect(avatarFor(second, "bia@sitio.com")).toBe("🌽");
    expect(first.avatars).toEqual({ "ana@sitio.com": "🍅" });
  });

  it("emoji nulo volta para as iniciais", () => {
    const chosen = withAvatar(DEFAULT_SETTINGS, "ana@sitio.com", "🍅");
    expect(avatarFor(withAvatar(chosen, "ana@sitio.com", null), "ana@sitio.com")).toBeNull();
  });
});

describe("createSettingsStore", () => {
  it("começa no padrão e carrega o que estava salvo", async () => {
    const store = createSettingsStore(memoryStorage(serializeSettings({ ...DEFAULT_SETTINGS, reduceMotion: true })));
    expect(store.get()).toEqual(DEFAULT_SETTINGS);

    await store.load();

    expect(store.get().reduceMotion).toBe(true);
  });

  it("update muda, avisa quem acompanha e grava", async () => {
    const storage = memoryStorage();
    const store = createSettingsStore(storage);
    const listener = jest.fn();
    store.subscribe(listener);

    await store.update({ reduceMotion: true });

    expect(store.get().reduceMotion).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(parseSettings(storage.value())).toEqual({ ...DEFAULT_SETTINGS, reduceMotion: true });
  });

  it("quem cancelou a inscrição não é mais avisado", async () => {
    const store = createSettingsStore(memoryStorage());
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    await store.update({ reduceMotion: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it("o ícone escolhido é guardado junto das configurações", async () => {
    const storage = memoryStorage();
    const store = createSettingsStore(storage);

    await store.update(withAvatar(store.get(), "ana@sitio.com", "🌻"));

    expect(avatarFor(parseSettings(storage.value()), "ana@sitio.com")).toBe("🌻");
  });

  it("falha ao ler ou gravar não derruba o app: a escolha vale até fechar", async () => {
    const broken: SettingsStorage = {
      read: async () => {
        throw new Error("bloqueado");
      },
      write: async () => {
        throw new Error("bloqueado");
      },
    };
    const store = createSettingsStore(broken);

    await expect(store.load()).resolves.toBeUndefined();
    await expect(store.update({ reduceMotion: true })).resolves.toBeUndefined();
    expect(store.get().reduceMotion).toBe(true);
  });
});
