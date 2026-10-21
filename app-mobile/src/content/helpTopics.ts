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
      "O Raiz Conecta liga você a mercados da sua região. Aqui você escolhe o que produz (Catálogo), recebe e responde os pedidos dos mercados (Ofertas), separa e pesa os pedidos nos dias de entrega (Entregas) e vê o resumo no Painel, pelo botão Início. Perfil, balança, configurações e ajuda ficam na aba Mais.",
    screens: ["painel", "ofertas", "entregas", "mais", "perfil", "configuracoes"],
  },
  {
    id: "como-comecar",
    question: "Por onde eu começo?",
    answer:
      "Comece pelo Catálogo: marque os produtos que você planta e toque em Salvar Escolhas. Depois abra Ofertas, onde chegam os pedidos dos mercados para esses produtos.",
    screens: ["ofertas", "catalogo", "painel"],
  },
  {
    id: "ofertas-vazio",
    question: "Por que não chegam pedidos?",
    answer:
      "Os pedidos chegam quando um mercado pede um dos produtos do seu Catálogo, e cada pedido mostra só os produtos que você marcou. Abra o Catálogo, marque o que você produz e toque em Salvar Escolhas. Se já fez isso, volte mais tarde: os pedidos vão chegando conforme os mercados compram.",
    screens: ["ofertas", "painel"],
  },
  {
    id: "responder-proposta",
    question: "Como respondo a um pedido?",
    answer:
      "Em Ofertas, os pedidos aparecem agrupados por mercado: toque no mercado para abrir a lista. Um mercado pode ter um ou vários pedidos, e cada pedido mostra os produtos, o preço fixo e o dia da entrega. Escolha quanto você aceita de cada produto, ou toque em Aceitar tudo, e confirme em Confirmar quantidades. Para não aceitar nada, toque em Recusar pedido. O preço não muda: ele é definido pela equipe da Raiz.",
    screens: ["ofertas", "painel"],
  },
  {
    id: "filtros-ofertas",
    question: "Como acho um pedido?",
    answer:
      "Use a busca (produto ou mercado) e os filtros Todos, Pendentes, Aceitos e Encerrados. O botão Ordenar põe em ordem. O que você aceitou fica planejado em Entregas.",
    screens: ["ofertas", "painel"],
  },
  {
    id: "tempo-proposta",
    question: "E se o tempo do pedido acabar?",
    answer:
      "Cada pedido vale por 30 minutos, já contando o tempo de o aviso chegar até você. Sem resposta no prazo, o pedido vira Expirado e segue para outro produtor. O mesmo acontece se você recusar. Por isso responda logo que o pedido chegar; o contador mostra quanto tempo resta.",
    screens: ["ofertas", "painel"],
  },
  {
    id: "salvar-catalogo",
    question: "Marquei produtos e nada mudou. E agora?",
    answer:
      "As escolhas só valem depois de tocar em Salvar Escolhas, na barra que aparece embaixo da tela. Depois de salvar, os pedidos dos seus produtos passam a chegar em Ofertas.",
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
      "Em Mais, toque em Configurações e, na seção Acessibilidade, ligue Reduzir animações. As telas passam a aparecer sem deslizes nem movimentos.",
    screens: ["configuracoes", "mais"],
  },
  {
    id: "sair",
    question: "Como saio da minha conta?",
    answer:
      "Toque no seu ícone, no canto de cima, e escolha Sair da conta; também dá para sair pela aba Mais. Se mudar de ideia, toque em Ficar.",
    screens: ["perfil", "configuracoes", "mais"],
  },
  {
    id: "suporte",
    question: "Como falo com o suporte?",
    answer: `Em Meu Perfil ou na aba Mais, toque em Falar com Suporte. O chat de suporte chega em breve; para urgências, escreva para ${SUPPORT_EMAIL}.`,
    screens: ["perfil", "configuracoes", "mais", "ofertas"],
  },
  {
    id: "botao-ajuda",
    question: "Como escondo ou mostro este botão?",
    answer:
      "Abra o botão e toque em Esconder botão: ele fica na lateral da tela. Para ele voltar, toque na abinha que ficou na lateral.",
    screens: ["catalogo", "ofertas", "entregas", "painel", "mais", "perfil", "configuracoes", "balanca"],
  },
  {
    id: "mover-botao",
    question: "Posso mudar o botão de lugar?",
    answer:
      "Pode. Segure o botão verde e arraste para onde quiser; ao soltar, ele gruda na lateral mais próxima. Se você o esconder, ele fica só com uma abinha na lateral, e ainda dá para arrastar a abinha para outro ponto.",
    screens: ["catalogo", "ofertas", "entregas", "painel", "mais", "perfil", "configuracoes", "balanca"],
  },
  {
    id: "desfazer",
    question: "Fiz algo sem querer. Como desfaço?",
    answer:
      "Logo depois de salvar o catálogo, definir um preço, sugerir um produto ou mudar o perfil, aparece um aviso com o botão Desfazer. Se ele já sumiu, abra o botão verde e toque em Desfazer ação recente: você tem um minuto para voltar atrás.",
    screens: ["catalogo", "ofertas", "entregas", "painel", "mais", "perfil", "configuracoes", "balanca"],
  },
  {
    id: "preco-ofertado",
    question: "Como defino o preço dos meus produtos?",
    answer:
      "No Catálogo, marque o produto e toque no lápis com o preço (ou em Definir preço). É o preço que você sugere: ele ajuda a equipe a montar os pedidos, mas não muda o preço dos pedidos, que é fixo. A média que aparece ali é só uma referência.",
    screens: ["catalogo", "ofertas"],
  },
  {
    id: "como-funciona-preco",
    question: "Como funciona o preço dos pedidos?",
    answer:
      "Cada pedido de mercado chega a um produtor por vez, com preço fixo e 30 minutos para responder. Você pode aceitar só uma parte de cada produto: o resto segue para outro produtor, e outros produtores completam o pedido. Se você recusar, ou o tempo acabar, o pedido inteiro segue para outro produtor. Você não negocia o valor, mas o preço que sugere no Catálogo ajuda a equipe a ajustá-lo.",
    screens: ["ofertas", "catalogo", "painel"],
  },
  {
    id: "preco-vendas-painel",
    question: "O que é Preços e vendas no Painel?",
    answer:
      "É a média do mercado para cada produto seu: quanto os produtores pedem, a que preço vendeu e se as vendas subiram ou caíram. Serve para você ver se o seu preço está acima ou abaixo da média.",
    screens: ["painel"],
  },
  {
    id: "como-entregar",
    question: "Como funcionam as entregas?",
    answer:
      "Cada produto que você aceita entra no pedido do mercado, com entrega às terças e sextas. Em Entregas você vê o total a separar no dia e toca em Iniciar pesagem: o app mostra um produto por vez e o celular fala o que pesar. Com tudo pesado, toque em Entregar pedido à logística; o mercado confere o peso ao receber.",
    screens: ["entregas", "ofertas", "painel"],
  },
  {
    id: "dias-entrega",
    question: "Em que dias eu entrego?",
    answer:
      "A equipe define dois dias de entrega por semana; por enquanto são terça e sexta. Você tem até o dia para separar e pesar o pedido. As abas de dia, em Entregas, mostram o que separar em cada um, e o número na aba avisa quantos pedidos esperam você.",
    screens: ["entregas", "ofertas", "painel"],
  },
  {
    id: "faixa-de-peso",
    question: "Quanto o peso pode variar?",
    answer:
      "O peso do pedido aceita uma pequena variação: até 2% a menos e até 10% a mais. Para 10 kg, vale de 9,8 a 11 kg. Dentro da faixa a entrega segue; fora dela o app avisa quanto falta ou passou, e o mercado é avisado da diferença.",
    screens: ["entregas"],
  },
  {
    id: "usar-balanca",
    question: "Como uso a balança?",
    answer:
      "Toque em Iniciar pesagem, em Entregas. O celular fala o produto e o peso; ponha na balança e, no modo rápido, o app registra e passa ao próximo sozinho quando o peso estabiliza. No modo manual, você toca em Registrar e confirma cada pedido. Sem balança, escolha Digitar peso.",
    screens: ["entregas"],
  },
  {
    id: "modo-pesagem",
    question: "O que é o modo rápido de pesagem?",
    answer:
      "Em Mais, toque em Configurações. A Pesagem automática vem ligada: o app registra o peso e passa ao próximo produto sozinho. Desligada, você registra cada produto e confirma cada pedido antes de seguir.",
    screens: ["entregas", "configuracoes", "mais"],
  },
  {
    id: "conectar-balanca",
    question: "Como conecto a balança?",
    answer:
      "Abra Mais e toque em Minha balança. São 2 passos: escolha a balança que o celular encontrou e confirme o vínculo. Ela passa a valer só para a sua conta, e você pode desvincular quando quiser.",
    screens: ["mais", "balanca", "entregas"],
  },
  {
    id: "aba-mais",
    question: "O que tem na aba Mais?",
    answer:
      "Seu perfil, a balança, as configurações, os termos de uso, a política de privacidade, a ajuda e a saída da conta. O seu ícone, no canto de cima, leva só ao perfil e à saída.",
    screens: ["mais", "balanca", "configuracoes"],
  },
  {
    id: "botao-inicio",
    question: "Para que serve o botão Início?",
    answer:
      "O botão redondo no meio da barra leva ao Painel, o resumo da sua atividade. Ele é a primeira tela de toda vez que você entra no app.",
    screens: ["painel", "catalogo", "ofertas", "entregas"],
  },
];

export function topicById(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.id === id);
}

// Perguntas ainda não feitas: primeiro as da tela atual, depois as outras.
export function suggestionsFor(screen: ScreenId, askedIds: string[], limit: number = HELP_TOPICS.length): HelpTopic[] {
  const pending = HELP_TOPICS.filter((topic) => !askedIds.includes(topic.id));
  const relevant = pending.filter((topic) => topic.screens.includes(screen));
  const others = pending.filter((topic) => !topic.screens.includes(screen));
  return [...relevant, ...others].slice(0, limit);
}
