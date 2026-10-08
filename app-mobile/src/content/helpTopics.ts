import type { ScreenId } from "@/lib/assistant/fabActions";
import { SUPPORT_EMAIL } from "./support";

export interface HelpTopic {
  id: string;
  question: string;
  answer: string;
  // Telas em que esta pergunta é mais útil; aparece primeiro nelas.
  screens: ScreenId[];
}


// Perguntas e respostas fixas do assistente. Linguagem simples, respostas curtas.
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "visao-geral",
    question: "O que eu posso fazer no Raiz Conecta?",
    answer:
      "O Raiz Conecta liga você a mercados da sua região. Aqui você escolhe o que produz (Catálogo), vê os pedidos dos mercados (Mural), diz quanto vai enviar (Ofertar), acompanha seus negócios (Ofertas) e vê o resumo no Painel.",
    screens: ["painel", "ofertas", "perfil", "configuracoes"],
  },
  {
    id: "como-comecar",
    question: "Por onde eu começo?",
    answer:
      "Comece pelo Catálogo: marque os produtos que você planta e toque em Salvar Escolhas. Depois abra o Mural, onde aparecem os pedidos desses produtos.",
    screens: ["mural", "catalogo", "painel"],
  },
  {
    id: "mural-vazio",
    question: "Por que meu Mural está vazio ou escondido?",
    answer:
      "O Mural só mostra pedidos dos produtos que você salvou no Catálogo. Se ele está escondido, abra o Catálogo, marque o que você produz e toque em Salvar Escolhas. Se não há pedidos, volte mais tarde ou marque mais produtos.",
    screens: ["mural", "painel"],
  },
  {
    id: "como-ofertar",
    question: "Como faço uma oferta?",
    answer:
      "No Mural, escolha o pedido, use + e − (ou digite) para dizer quanto vai enviar e toque em Ofertar. Você não pode oferecer mais do que ainda falta no pedido.",
    screens: ["mural", "ofertas", "painel"],
  },
  {
    id: "onde-ofertas",
    question: "Onde vejo o que já ofertei?",
    answer:
      "Na aba Ofertas ficam todos os pedidos em que você garantiu uma quantidade. Use Todas, Em aberto e Fechadas para achar o que procura.",
    screens: ["mural", "ofertas", "painel"],
  },
  {
    id: "salvar-catalogo",
    question: "Marquei produtos e nada mudou. E agora?",
    answer:
      "As escolhas só valem depois de tocar em Salvar Escolhas, na barra que aparece embaixo da tela. Depois de salvar, o Mural é atualizado.",
    screens: ["catalogo"],
  },
  {
    id: "produto-nao-achei",
    question: "Não achei meu produto no catálogo. O que faço?",
    answer:
      "Toque no botão verde de ajuda, no canto da tela, e escolha Sugerir produto. Conte o nome e, se quiser, o preço e uma foto. Veja como anda em Minhas sugestões.",
    screens: ["catalogo"],
  },
  {
    id: "filtros-catalogo",
    question: "Como busco ou filtro os produtos?",
    answer:
      "Digite o nome na busca. Use Todos, Selecionados ou Não selecionados para filtrar e o botão Ordenar para pôr em ordem. O modo Detalhes mostra uma lista compacta, com mais produtos de uma vez.",
    screens: ["catalogo"],
  },
  {
    id: "status-sugestoes",
    question: "O que significam os status das sugestões?",
    answer:
      "Em análise: nossa equipe ainda vai avaliar. Aprovada: o produto já está no catálogo. Recusada: não entrou, e o motivo aparece junto.",
    screens: ["catalogo"],
  },
  {
    id: "dados-conta",
    question: "Como mudo meus dados ou minha senha?",
    answer:
      "Toque no seu ícone, no canto de cima, e escolha Meu Perfil. E-mail e documento ficam travados por segurança; para trocar, fale com o suporte.",
    screens: ["perfil", "configuracoes"],
  },
  {
    id: "escolher-icone",
    question: "Como troco o meu ícone?",
    answer:
      "Em Meu Perfil, toque em um dos ícones da seção Seu ícone. Ele passa a aparecer no canto de cima, no lugar da inicial do seu nome.",
    screens: ["perfil"],
  },
  {
    id: "reduzir-animacoes",
    question: "Como deixo o app com menos movimento?",
    answer:
      "Em Configurações, na seção Acessibilidade, ligue Reduzir animações. As telas passam a aparecer sem deslizes nem movimentos.",
    screens: ["configuracoes"],
  },
  {
    id: "sair",
    question: "Como saio da minha conta?",
    answer: "Toque no seu ícone, no canto de cima, e escolha Sair da conta. Se mudar de ideia, toque em Ficar.",
    screens: ["perfil", "configuracoes"],
  },
  {
    id: "suporte",
    question: "Como falo com o suporte?",
    answer: `Em Meu Perfil ou em Configurações, toque em Falar com Suporte. O chat de suporte chega em breve; para urgências, escreva para ${SUPPORT_EMAIL}.`,
    screens: ["perfil", "configuracoes", "ofertas"],
  },
  {
    id: "botao-ajuda",
    question: "Como escondo ou mostro este botão?",
    answer:
      "Abra o botão e toque em Esconder botão: ele fica na lateral da tela. Para ele voltar, toque na abinha que ficou na lateral.",
    screens: ["mural", "catalogo", "ofertas", "painel", "perfil", "configuracoes"],
  },
];

export function topicById(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.id === id);
}

// Perguntas ainda não feitas: primeiro as da tela atual, depois as outras.
export function suggestionsFor(
  screen: ScreenId,
  askedIds: string[],
  limit: number = HELP_TOPICS.length,
): HelpTopic[] {
  const pending = HELP_TOPICS.filter((topic) => !askedIds.includes(topic.id));
  const relevant = pending.filter((topic) => topic.screens.includes(screen));
  const others = pending.filter((topic) => !topic.screens.includes(screen));
  return [...relevant, ...others].slice(0, limit);
}
