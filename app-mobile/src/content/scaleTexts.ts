export const SCALE_SETUP = {
  title: "Balança",
  intro: "Adicione suas balanças e escolha qual delas está conectada. Para pesar sem digitar, deixe uma conectada.",
  banner: { title: "Conecte sua balança", description: "2 passos para pesar os pedidos sem digitar." },
  yourScales: "Minhas balanças",
  connected: "Conectada",
  connect: "Conectar",
  remove: "Remover",
  add: "Adicionar balança",
  cancelAdd: "Cancelar",
  renameHint: "Para dar outro nome à balança, abra Mais > Configurações.",
  steps: {
    find: { number: 1, title: "Escolha a balança", hint: "Ligue a balança e deixe-a perto do celular." },
    confirm: { number: 2, title: "Confirme", hint: "A balança passa a valer só para a sua conta e fica conectada." },
  },
  search: "Procurar balanças",
  searching: "Procurando balanças…",
  none: "Nenhuma balança nova encontrada. Confira se ela está ligada e procure de novo.",
  confirm: "Adicionar e conectar",
  back: "Trocar de balança",
  removeTitle: "Remover a balança?",
  removeDescription:
    "Ela sai da sua conta. Você poderá adicionar de novo quando quiser. Os pesos já registrados não mudam.",
  addedToast: "Balança adicionada e conectada!",
  connectedToast: "Balança conectada.",
  removedToast: "Balança removida.",
} as const;

// A linha da aba Mais para a balança.
export function scaleRowDescription(activeName: string | null, count: number): string {
  if (activeName) return `Conectada: ${activeName}`;
  return count > 0 ? "Nenhuma conectada. Toque para escolher." : "Não conectada. Toque para conectar em 2 passos.";
}

// O aviso de onde a balança se configura, na tela de Entregas e na pesagem.
export const SCALE_CONFIG_NOTE = "Para trocar, adicionar ou dar nome à balança, abra Mais > Configurações.";

// A etiqueta da balança no canto da pesagem.
export function scaleChipLabel(activeName: string | null): string {
  return activeName ?? "Sem balança conectada";
}

export const SCALE_SETTINGS = {
  title: "Balança",
  nameLabel: "Nome da balança conectada",
  namePlaceholder: "Ex.: Balança da horta",
  save: "Salvar nome",
  manage: "Adicionar, trocar ou remover balanças",
  noneConnected: "Nenhuma balança conectada.",
  connectNow: "Conectar uma balança",
  saved: "Nome da balança salvo.",
} as const;
