export const SCALE_SETUP = {
  title: "Balança",
  intro: "Escolha a balança conectada.",
  banner: { title: "Conecte sua balança", description: "2 passos para pesar os pedidos sem digitar." },
  yourScales: "Minhas balanças",
  connected: "Conectada",
  connect: "Conectar",
  remove: "Remover",
  add: "Adicionar balança",
  cancelAdd: "Cancelar",
  steps: {
    find: { number: 1, title: "Escolha a balança", hint: "Ligue a balança e deixe perto do celular." },
    confirm: { number: 2, title: "Confirme", hint: "Ela fica ligada só à sua conta." },
  },
  // Com a API: a balança é achada pelos dados da etiqueta colada nela.
  label: {
    title: "Dados da etiqueta",
    hint: "Estão na etiqueta colada na balança. Se tiver o QR Code, cole o texto dele no primeiro campo.",
    deviceLabel: "Endereço da balança",
    devicePlaceholder: "A4:CF:12:9B:07:E1",
    codeLabel: "Código da etiqueta",
    codePlaceholder: "K7M2-Q9XT",
    next: "Continuar",
    invalidDevice: "Digite o endereço completo da balança: 12 letras e números, como A4:CF:12:9B:07:E1.",
    invalidCode: "Digite o código da etiqueta: 8 letras e números, como K7M2-Q9XT.",
    alreadyYours: "Esta balança já está na sua conta.",
  },
  search: "Procurar balanças",
  searching: "Procurando balanças…",
  none: "Nenhuma balança encontrada.",
  confirm: "Adicionar e conectar",
  back: "Trocar de balança",
  removeTitle: "Remover a balança?",
  removeDescription: "Ela sai da sua conta.",
  addedToast: "Balança adicionada e conectada!",
  connectedToast: "Balança conectada.",
  removedToast: "Balança removida.",
} as const;

// A linha da aba Mais para a balança.
export function scaleRowDescription(activeName: string | null, count: number): string {
  if (activeName) return `Conectada: ${activeName}`;
  return count > 0 ? "Nenhuma conectada. Toque para escolher." : "Não conectada. Toque para conectar em 2 passos.";
}

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
