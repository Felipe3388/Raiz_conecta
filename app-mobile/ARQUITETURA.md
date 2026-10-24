# Arquitetura do app-mobile

Camadas inspiradas em MVC e SOLID (material "Boas Práticas de Programação", Fatec Votorantim).

| Camada | Pasta | Responsabilidade |
|---|---|---|
| View | `src/app`, `src/components` | Telas e componentes. Só apresentação, sem regra de negócio nem `fetch`. |
| Controller | `src/hooks` | Estado e fluxo de cada tela. Chama os services e entrega dados prontos à View. |
| Model | `src/services`, `src/types` | Regras de negócio e acesso aos endpoints da API. |
| Infra | `src/lib`, `src/config` | `ApiClient`, armazenamento do token, variáveis de ambiente. |
| Design system | `src/theme` | Tokens equivalentes às classes `.rc-*` do site. |

## Regras

- **SRP:** um arquivo, um motivo para mudar. Telas não falam HTTP; services não conhecem componentes.
- **DIP:** `ApiClient` recebe `getToken` e `fetchImpl`; o token fica atrás da interface `TokenStorage`. Testes usam fakes.
- **Singleton:** `getApiClient()` e `getTokenStorage()` devolvem instância única.
- **Strategy (por tabela):** regras que variam ficam em mapas de regras, sem cadeias de `if`. Ex.: `accessPolicy.ts` define a mensagem de cada status de conta.
- **TDD:** escrever o teste (Red), implementar o mínimo (Green), refatorar. Rodar com `npm test`.
- **Camadas travadas por teste:** `src/lib/architecture/layers.test.js` falha se uma regra em `lib/` importar React, tela, hook ou service, se `types/`, `services/` ou `content/` importarem o que não devem, ou se uma tela/componente chamar um service (só os tipos podem). `tsconfig.json` tem `noUnusedLocals`, então import ou variável sem uso quebra o `npm run typecheck` (o projeto não tem ESLint). O tipo de nome de ícone é um só, `types/icon.ts`.

## Fluxo de sessão (SCRUM-22)

`SessionProvider` (hooks) restaura a sessão ao abrir o app via `AuthService` (services), que lê o token do `TokenStorage` e decodifica o payload do JWT. Os layouts `(auth)` e `(produtor)` redirecionam conforme o estado da sessão. O app é exclusivo do perfil `produtor`.

## Cadastro (2 passos)

Espelha o site, só que sempre como Produtor (`tipoUsuario: "produtor"` fixo em `services/registrationFields.ts`; o app não cadastra Mercado). Passo 1 (`cadastro`) coleta os dados da conta; passo 2 (`completar-perfil`) coleta documento, endereço (CEP via ViaCEP) e foto do comprovante; `em-analise` encerra o fluxo. Os dados ficam em memória no `RegistrationProvider` entre os passos e são enviados de uma vez como multipart para `POST /api/auth/cadastro`. Validações e máscaras são funções puras em `lib/validation` e `lib/format`.

### Regras do cadastro

- **Documento:** CPF ou CNPJ (`lib/registration/rules.ts`). A foto enviada precisa combinar com o documento: CPF aceita RG ou CNH; CNPJ aceita Contrato Social ou Cartão CNPJ. Essas regras valem só no app; a API do site ainda não as exige.
- **Termos e Política de Privacidade:** mesmo texto do site, em `content/legalDocuments.ts`, exibidos em tela cheia por `LegalModal`. O aceite continua sendo a caixa de seleção.
- **Linguagem:** cada campo tem só o exemplo (placeholder), sem dicas sob ele; texto a partir de 14 px e campos com 56 px de altura, pensando em quem tem pouca prática com celular.
- **Senha:** o checklist (`PasswordChecklist` + `hooks/usePasswordChecklist`) mostra só o que ainda falta. Cada item entra em sequência, ao ser cumprido ganha o "feito" por 0,9 s e sai deslizando; com tudo cumprido a lista fecha. O medidor de força e o "Senhas conferem!" também abrem e fecham com `Collapse`. Com "Reduzir animações" tudo muda de uma vez.
- **Validação compartilhada:** `lib/validation/rules.ts` reúne as regras pequenas (telefone, CEP, UF, senha) usadas no cadastro e na edição do perfil.
- **Tipo de documento (passo 2):** as opções aparecem numa lista vertical (`ui/ChoiceList`, uma `radiogroup` com todas à vista), sem rolagem lateral; no navegador do computador não dá para "arrastar" com o mouse, então tudo precisa estar visível.

## Transição entre telas de entrada

Login, cadastro, passo 2 e "Conta em Análise" têm uma posição no fluxo (`components/motion/screenTransition.ts`). Avançar entra deslizando pela direita; voltar entra pela esquerda. No celular quem anima é a pilha nativa (`slide_from_right`); no navegador o `ScreenTransition` (aplicado pelo `screenLayout` do `(auth)/_layout`) faz o mesmo com `Animated`. A lógica de direção é uma função pura com teste.

## Área do Produtor (`src/app/(produtor)`)

O app é só do Produtor. Telas de Mercado não existem aqui.

```
(produtor)/_layout.tsx      guarda de sessão + provedores + Stack + botão de ajuda (AssistantHost)
  (tabs)/_layout.tsx        barra com quatro abas (Catálogo, Ofertas, Entregas, Mais) e o botão redondo Início no meio; ícone da conta no cabeçalho
    painel (tela inicial) · catalogo · ofertas · entregas · mais
  perfil.tsx                "Meu Perfil" (abre por cima das abas, com seta de voltar)
  configuracoes.tsx         "Configurações": modo de pesagem e acessibilidade (idem)
  balanca.tsx               "Balança": conexão em 2 passos e chave do vínculo (idem)
```

| Parte | Onde | O que faz |
|---|---|---|
| Regras de domínio | `lib/produtor`, `lib/pricing`, `lib/delivery`, `lib/undo`, `lib/assistant`, `lib/settings` | Funções puras e testadas: pedidos de Ofertas (situação, prazo de 30 minutos, quantidades escolhidas, agrupamento por mercado, busca, filtro e ordem em `proposals`), busca/filtro/ordem do catálogo (`catalogView`), resumo do painel (`dashboard`), preço sugerido, escada do leilão inverso (`dispatch`) e preços × vendas (`lib/pricing`), dias de entrega, pedidos e pesagem (`lib/delivery`, ver "Entregas e pesagem"), pilha de desfazer (`undoStack`), segurar + e − (`holdRepeat`, hoje sem uso nas telas), status das sugestões, iniciais do ícone, opções e posição do botão de ajuda (`fabActions`, `fabPlacement`), configurações do app. |
| Gateways | `services/CatalogGateway`, `ProposalGateway`, `ProfileGateway`, `PricingGateway`, `DeliveryGateway`, `ScaleGateway`, `AssistantGateway` | Contratos do que as telas precisam. Cada um tem versão simulada; o assistente já é um contrato assíncrono para um chatbot de verdade entrar depois sem mexer nas telas. |
| Dados simulados | `services/Mock*Service`, `FixedAssistantService`, `src/mocks` | 18 produtos, 8 pedidos de 3 mercados (com 1 a 2 produtos cada), 3 sugestões, preços e vendas de exemplo e um perfil de exemplo, com atraso para parecer rede. |
| Textos | `src/content` | Perguntas e respostas da Ajuda (`helpTopics`), nomes das ordens e filtros (`listOptions`), textos dos pedidos (`proposalTexts`), itens do menu do usuário (`userMenu`), frases dos preços e vendas (`priceTexts`), etapas, faixas e avisos das entregas (`deliveryTexts`), contato do suporte. |
| Provedores | `useProdutorData`, `usePricing`, `useDeliveries`, `useUndo`, `useProducerIdentity`, `useAssistant` | Dados compartilhados entre as abas; preços (ofertado, sugerido, mercado); entregas e pesagens; ações que dá para desfazer; nome e ícone do produtor; estado e posição do botão de ajuda. |
| Controllers | `useCatalogScreen`, `useOffersScreen`, `useDashboardScreen`, `useEntregasScreen`, `useWeighSheet`, `useScale`, `useNow`, `useProfileScreen`, `useSettingsScreen`, `usePriceEditing`, `usePriceForm`, `useHoldRepeat`, `useHelpChat`, `useMySuggestions`, `useUserMenu`, `useSuggestionForm` | Estado e fluxo de cada tela ou janela. As telas só renderizam. |
| Avisos | `hooks/useToast` + `ToastBanner` | Aviso rápido no topo ("Catálogo salvo!"), como o sonner do site. Pode trazer um botão (usado pelo "Desfazer"). |

Regras de comportamento: a barra "Salvar Escolhas" só aparece quando há mudança; os filtros do catálogo agem sobre a seleção em andamento, não só a salva. Os pedidos de Ofertas chegam para os produtos marcados no catálogo (no modo simulado a lista de exemplo é fixa).

### Botão de ajuda (`components/assistant`)

Quando o botão está **escondido na lateral** só metade dele aparece (`PEEK` = 30 px) e fica meio transparente; a setinha (28 px) fica no meio dessa metade, na horizontal e na vertical (o `justifyContent` só mexe na horizontal se o botão for `row`).


Botão redondo, visível em **todas as telas do Produtor** (fica no layout, acima da pilha). Começa no canto inferior direito. Abre opções que mudam conforme a tela (`lib/assistant/fabActions.ts`, uma tabela tela → opções):

| Tela | Opções |
|---|---|
| Catálogo | Sugerir produto · Minhas sugestões · Ajuda |
| Ofertas | Ajustar meu catálogo · Ajuda |
| Entregas, Painel | Ver minhas ofertas · Ajuda |
| Mais, Meu Perfil, Configurações, Balança | Ajuda |

Em qualquer tela, enquanto houver algo para desfazer, entra **Desfazer ação recente** antes da Ajuda (ver "Desfazer"). Todas trazem "Mudar de lado" e "Esconder botão".

**Reposicionável, como o AssistiveTouch do iPhone.** Dá para arrastar o botão para qualquer altura da tela; ao soltar ele gruda na lateral mais perto (`snapPlacement`). "Esconder botão" o recolhe na lateral, deixando só uma abinha de 30 px, que também pode ser arrastada (escondida, ela muda de lado e de altura sem aparecer), e um toque o mostra de novo. "Mudar de lado" é a alternativa a arrastar para quem não consegue. A posição é guardada nas configurações como lado + altura em proporção de 0 a 1 (`Settings.fabPlacement`), então vale para qualquer tamanho de tela; o "escondido" não é guardado. Toda a conta (onde ele fica, para onde as opções abrem, quanto sobe por uma barra) é função pura em `lib/assistant/fabPlacement.ts`.

Convivência com o resto da tela: sobe sozinho quando aparece uma barra fixa embaixo e ele está perto dela (`useFabLift`, usado pelo `SaveBar`; lá em cima a barra não o afeta), some com o teclado aberto, as opções abrem para cima ou para baixo conforme o espaço, e as listas deixam folga no fim (`bottomSpace`) para o último item nunca ficar embaixo dele.

Cuidados que valem para o navegador (descobertos nos testes):

- O arrastar só "pega" depois de o dedo andar 6 px, para o toque simples continuar abrindo o menu. O `PanResponder` zera a conta ao pegar, então `fabPlacement.dragPoint` soma o que o dedo já andou; sem isso o botão ficava atrás do dedo.
- O navegador consulta o arrastar só enquanto o cursor está sobre o botão. Um mouse muito rápido logo no começo, sobretudo na abinha de 30 px, pode não pegar; é só repetir mais devagar. No celular não acontece.
- Soltar o mouse com o cursor ainda sobre o botão gera um clique; ele é ignorado por 250 ms depois de soltar, senão o menu abriria a cada arrastada.
- A camada do botão usa `overflow: "clip"` no navegador (`hidden` ainda deixa o navegador rolar o conteúdo e o botão escondido ficava no meio do caminho). O menu tem a largura útil da tela; sem isso as opções de texto longo vazavam pela lateral. **Ajuda** é um mini chat com perguntas fixas (`FixedAssistantService`); as da tela atual vêm primeiro. Para trocar por um chatbot de verdade, basta outra implementação de `AssistantGateway` em `services/index.ts`.

### Painel, menu do usuário e Configurações

- **Painel** (tela inicial, botão Início): receita estimada do que foi aceito (quantidade aceita × preço fixo de cada produto), cartão "Próxima entrega" (quantos pedidos separar e entregar até o próximo dia de entrega) que leva à aba Entregas, três contadores (Para responder, Aceitos, No catálogo) que levam às outras telas, gráfico de barras de uma série (receita por produto, até 5 produtos + "Outros produtos"), **Preços e vendas** (ver "Ofertas, preço e leilão inverso") e **Responder primeiro**, com os 3 pedidos pendentes de prazo mais curto (mercado e produtos). A parte de preços e vendas usa os dados simulados do `PricingGateway`; o resto é calculado com o que o app já carregou.
- **Menu do usuário:** o círculo no canto do cabeçalho das abas (onde ficava o "Sair") mostra as iniciais ou o ícone que o produtor escolheu e abre um menu suspenso logo abaixo dele com **só Meu Perfil e Sair da conta** (com confirmação). Configurações, privacidade, termos e ajuda ficam na aba Mais.
- **Ícone da conta:** escolhido em Meu Perfil, entre as iniciais e 10 desenhos. Fica guardado no aparelho, por e-mail (`Settings.avatars`); o site ainda não tem esse campo.
- **Mais** (`(tabs)/mais.tsx`, `content/moreMenu.ts`, `hooks/useMoreScreen.ts`), no estilo da aba Mais do Mercado Livre, mas **com mais respiro**: grupos de linhas (`SettingsGroup`, `SettingsRow`) com linhas altas (mínimo 56 px), título de seção acima de cada grupo e 24 px entre os grupos. Cartão da conta (leva ao perfil), destaque "Conecte sua balança" enquanto não há balança conectada, e as seções Minha conta (Meu Perfil, Minha balança, que mostra o nome da balança conectada e quantas há), Preferências (Configurações), Privacidade (Termos de Uso, Política de Privacidade), Ajuda (Ajuda, Falar com Suporte) e Sair da conta. Cada linha é uma ação numa tabela (Strategy), sem `if` em cadeia.
- **Configurações** (grupos em `SettingsGroup`, no estilo lista agrupada): **Pesagem** ("Pesagem automática (modo rápido)", ligada por padrão, `Settings.autoWeigh`; "Voz na pesagem", ligada por padrão, `Settings.voice`, lembrada entre as aberturas do app), **Balança** (o nome da balança conectada, que o produtor pode trocar ali, e o atalho para gerenciar as balanças; `useSettingsScreen`) e Acessibilidade ("Reduzir animações", somado ao que o aparelho já pede).
- **Balanças** (`balanca.tsx`, `useScaleSetup`, `ScaleCard`, `ScaleLinkGateway`, `lib/delivery/scaleLink`): o produtor pode ter **várias balanças**, adicionar, **renomear** e **remover** (com confirmação). Só uma fica **conectada** por vez e ela aparece destacada (selo "Conectada", fundo verde); as outras têm "Usar esta". O gateway tem `getState`, `findDevices`, `add`, `activate`, `rename` e `remove`; remover a conectada deixa o produtor sem nenhuma conectada. O **nome** (`cleanScaleName`: sem espaços sobrando, até 30 caracteres) é o que o produtor vê na tela de pesagem, no Mais e nas Configurações. A **chave do vínculo** junta o código do produtor e o código da balança (MAC normalizado): `P{produtor}-B{balança}`; ela existe só por baixo (`buildLinkKey`) e **não aparece para o produtor**. Hoje é o `MockScaleLinkService` (RC-01, RC-02 e RC-03). Quando houver backend: `GET/POST /api/produtor/balancas`, `PUT .../{id}/conectada`, `PATCH .../{id}` (nome) e `DELETE .../{id}`; o método seguro final da chave ainda será decidido. Pode virar token enviado junto com o peso.
- **Ofertas só com o que o produtor vende** (`onlyMyProducts` em `lib/produtor/proposals`, aplicado em `useProdutorData`): o mercado aparece, mas só com os produtos que estão no catálogo salvo do produtor; salvou o catálogo, a lista de Ofertas se atualiza. Hoje o filtro é no app; o servidor fará o mesmo depois.

### Ofertas, preço e leilão inverso

A aba **Ofertas** substituiu o Mural: o mercado faz **pedidos** e o sistema os envia ao produtor com **preço fixo por produto**. O produtor **não define o preço nem negocia**: escolhe **quanto aceita de cada produto** (ou recusa o pedido todo) dentro de **30 minutos** (`PROPOSAL_WINDOW_MINUTES` em `lib/produtor/proposals`; o prazo já conta o tempo de o aviso chegar por e-mail, depois WhatsApp ou notificação; quem impõe o prazo é o servidor, o app só mostra a contagem regressiva e a aba mostra quantos pedidos esperam resposta).

- **Mercado → pedidos → produtos.** Um mercado pode ter um pedido ou vários, e cada pedido, um ou vários produtos. A lista é de **mercados** (`MarketCard`, com o símbolo da loja, o nome, quantos pedidos e quantos esperam resposta); tocar abre a lista de pedidos (`groupByMarket`). Todos os mercados **começam fechados**: a pessoa toca para ver os pedidos e os produtos; o cartão fechado já mostra quantos pedidos esperam resposta e o **tempo do pedido mais urgente** (ao lado da seta de expandir, em vermelho quando falta menos de 2 minutos). Depois de responder, o mercado fica aberto para a pessoa ver o resultado. Dentro do mercado, cada **pedido** (`OrderBlock`, "Pedido nº 2052") mostra a entrega, a contagem regressiva e os produtos (`OrderItemRow`): quanto o mercado pediu, o preço fixo e o campo de quantidade (`QuantityInput`, de 0 até o pedido).
- **Aceite parcial.** O produtor pode aceitar **só uma parte** de cada produto; **o resto do pedido segue para outro produtor, e outros mais, até vários completarem o pedido** (o servidor faz isso com a escada de `lib/pricing/dispatch`). Cada pedido guarda **as suas próprias quantidades** (`useOffersScreen`), então dá para fazer escolhas diferentes no mesmo pedido e em pedidos diferentes ao mesmo tempo. Começa tudo em 0 (nada é aceito sem querer); "Aceitar tudo" preenche o oferecido, "Limpar" zera, "Confirmar quantidades" só vale com pelo menos um produto (`quantitiesError`) e "Recusar pedido" recusa tudo. A confirmação (`ConfirmModal`) lista as quantidades, o valor e avisa que o que ficou de fora segue para outros produtores; a resposta não tem volta.
- **Modelo** (`types/proposal`): `Proposal` é um pedido (`numero`, `mercado`, `itens`, `entrega`, prazo); cada `ProposalItem` tem `quantidade` oferecida, `preco` fixo e `aceita` (null até responder; 0 até `quantidade` depois). O gateway recebe `ProposalResponse` (`RECUSAR` ou `ACEITAR` com as quantidades por produto). Cada produto aceito pelo produtor também ajusta o preço sugerido (aceito se tem quantidade, recusado se ficou em 0).
- **Situações** (`lib/produtor/proposals`): pendente, aceito, recusado e expirado. Pendente com prazo vencido vale como **expirado** (`effectiveStatus`), mesmo que a lista ainda não tenha sido atualizada; responder depois do prazo é recusado (`canAnswer`).
- **Tudo do antigo Mural, na mesma tela:** busca por produto ou mercado; filtros Todos · Pendentes · Aceitos · Encerrados (recusados e expirados), com a quantidade em cada um; ordem Pendentes primeiro · Mais recentes · Maior valor · Mercado (A a Z). O que foi aceito fica planejado em Entregas.
- **Aceitar cria as entregas** no dia combinado: `MockDeliveryService` cria **uma entrega por produto aceito**, com a **quantidade aceita** (não a pedida) e o `propostaId` do pedido de origem, a partir de `ProposalGateway`; em Entregas elas se juntam por mercado e dia, como antes. A receita do Painel também conta só o que foi aceito.

**Quem decide o preço é o sistema (leilão inverso), no servidor.** O app só recebe o preço fixo da vez e nunca o preço do mercado nem a escada. A regra está em `lib/pricing/dispatch` (usada só para montar os dados de exemplo e documentar o combinado):

1. O pedido vai a **um produtor por vez**, começando baixo (`START_FACTOR` 0,8 do preço que o mercado paga). Exemplo: o mercado paga R$ 50 e a primeira proposta sai a R$ 40.
2. Se o produtor recusa ou deixa o prazo acabar, o pedido vai para **outro produtor com um degrau a mais** (`LADDER_STEP`, 2% do preço do mercado: 40, 41, 42, 43, 44...), por até `REGULAR_ROUNDS` (5) rodadas.
3. Se ninguém aceitou até o preço médio, volta ao primeiro produtor com um preço próximo do teto que o mercado pagou (`RETURN_FACTOR` 0,9: R$ 45 para os R$ 50). O teto cobre os custos da plataforma.
4. Quem escolhe o preço de venda ao mercado (o preço médio) são os administradores, ajudados pelo **preço sugerido**.

As constantes são suposições a confirmar com o negócio.

Há **dois preços que não se misturam** (o produtor não escolhe o preço da proposta):

- **Preço ofertado:** o que o produtor diz que pede por unidade de cada produto. Ele define no Catálogo, pelo lápis "Definir preço" / "R$ x" de cada produto marcado (`PriceSheet`, controller `usePriceEditing`). É só uma **informação para a equipe**, não o preço de nenhuma proposta.
- **Preço sugerido:** a média calculada pela plataforma, **só para ajudar os administradores** a fixar o preço de venda. O produtor vê apenas que o preço é uma sugestão para a equipe; ele nunca aparece como decisão.

**Como o preço sugerido aprende** (`lib/pricing/suggestion`): parte da média dos preços que os produtores definiram (descartando os que fogem de 0,5× a 2× a mediana) e cada resposta puxa a média 30% na sua direção: uma recusa acima da média a empurra para cima (com 5% de margem), um aceite abaixo dela a puxa para baixo. Recusa abaixo da média não a mexe. Aceitar ou recusar uma proposta registra a resposta (`pricing.recordResponse`, com o preço fixo da proposta), sem esperar nem atrapalhar o produtor se falhar. É um primeiro protótipo transparente e testado, feito para ser trocado por algo melhor quando houver base de dados de verdade.

**Painel, "Preços e vendas"** (`lib/pricing/insights`): para cada produto que o produtor cultiva, compara o preço dele com a média vendida (ponderada pelo volume) e a venda do período com o anterior (a partir de 5% de diferença é "vendendo mais" ou "menos"; até 3% do preço é "na média"). A frase final diz o que fazer: definir preço, baixar, subir ou manter.

O antigo **Simulador de preço**, a negociação com pausa e o cruzamento "preço do pedido × preço do produtor" saíram: não fazem sentido com preço fixo.

- **Pedido e oferta em destaque, arrastar ou digitar** (`OrderItemRow`, `QuantitySlider`, `OFFER_TEXTS`): em cada produto de um pedido que espera resposta aparecem dois números grandes lado a lado, **PEDIDO** (o que o mercado pediu) e **VOCÊ OFERECE** (o que o produtor escolheu; verde se for tudo, âmbar se for parte, cinza se for zero). Embaixo, uma **barra para arrastar** a quantidade (de 0 ao pedido; tocar em qualquer ponto leva até ali; o preenchimento mostra "Você atende 67% deste pedido") e, abaixo dela, o campo de digitar com − e +. Os três controles mexem na mesma quantidade. As contas são puras: `valueFromPosition`/`positionFraction` (`lib/produtor/quantity`) e `fulfilmentPercent` (`lib/produtor/demand`).
- **Demanda dos mercados por produto** (`DemandSummary`, `lib/produtor/demand`): cartão no topo de Ofertas, fechado por padrão com o total ("7 produtos · você cobre 67%", calculado pelo valor em reais porque as unidades variam). Aberto, mostra cada produto com o **total pedido somando os mercados**, o que o produtor **oferece** (já aceito + o que está escolhendo agora) e uma barra com as duas partes (verde forte = aceito, verde claro = escolhendo). Entram os pedidos pendentes dentro do prazo e os aceitos; recusados e expirados ficam de fora. A conta usa todos os pedidos, não só os da busca.
- **Catálogo:** o aviso "Selecione o que você produz" fica **sempre visível**, nas visões Grade e Detalhes, e traz o botão **Sugerir novo produto** (o mesmo que a opção do botão +, abre pelo `useAssistant`).
- **Pedido aceito, só o essencial** (`OrderItemRow`, `OrderBlock`): depois de respondido, o item deixa de mostrar o campo de quantidade e vira uma linha de resultado (`ResultRow`) com o que foi aceito: **verde** se aceitou tudo ("30 kg · R$ 344,40"), **âmbar** se aceitou parte ("aceito 20 de 30 kg") e **cinza** se não aceitou. O rodapé mostra só "Você recebe" e que o pedido já está em Entregas.

### Navegação: barra com o botão Início (`ProducerTabBar`)

O login sempre cai no **Painel** (`app/index.tsx` e o redirecionamento do `(auth)/_layout` apontam para `/painel`; `initialRouteName="painel"`). A barra tem quatro abas, duas à esquerda (Catálogo, Ofertas) e duas à direita (Entregas, Mais), e no meio um **botão redondo Início**, um pouco acima das outras, que leva ao Painel. `lib/produtor/tabs.ts` (`splitTabs`) decide quais ficam à esquerda e à direita (com número ímpar, sobra para a direita) e qual é a "casa" (`HOME_ROUTE`). Cada metade da barra ocupa metade da largura, então o botão fica sempre no centro da tela. Voltar (`backBehavior="initialRoute"`) leva ao Painel.

**Animações da barra:** a troca de aba usa `animation: "shift"` do React Navigation (a tela desliza para o lado da aba nova). Cada aba é um `TabBarItem`: a "pílula" verde atrás do ícone cresce do centro para os lados com mola, o ícone sobe 1 px e o texto muda de cor (`useFocusAnimation`, 0→1 por mola). O botão Início cresce 8% quando o Painel está aberto. Com "reduzir animações" tudo muda na hora.

Cuidados descobertos nos testes: o toque só chega a um botão que está **dentro da área do pai**, então a barra é uma view alta (faixa transparente de 20 px + 70 px de barra) e o botão é filho direto dela, em vez de "vazar" para fora. No navegador a seleção vai em `aria-selected` (o `accessibilityState` não vira atributo). A aba Entregas mostra quantos pedidos ainda pedem ação até o próximo dia de entrega (`pendingCount`) e a Ofertas quantos pedidos esperam resposta, com nomes completos para leitor de tela e singular/plural certos (`badgeLabel`: "Entregas, 1 pedido para a próxima entrega"). O botão de ajuda considera só os 70 px da barra (`TAB_BAR_CONTENT_HEIGHT`).

### Entregas e pesagem (`lib/delivery`, `components/entregas`)

**Só dois dias de entrega, definidos pela administração:** por ora **terça e sexta** (`DELIVERY_WEEKDAYS` em `lib/delivery/schedule`; trocar os dias é mudar essa constante). Todo pedido aceito já vem com um desses dias, e o produtor tem até ele para separar e entregar. Os chips da tela mostram os próximos dois dias de entrega ("Hoje, ter 13/10" · "sex, 16/10"), mais outro dia só se houver pedido nele, e "Concluídos".

**A unidade é o pedido (um mercado), não o produto.** Cada produto aceito gera uma entrega (`Delivery`, com `propostaId`, `mercado`, a quantidade aceita e o preço fixo), e `groupOrders` junta as do mesmo mercado e do mesmo dia num **pedido**, de 1 ou vários produtos. O cartão do pedido (`OrderCardView`, dados de `describeOrder`) mostra o mercado, quantos produtos e kg, o valor, **a lista de itens** (cada um com sua situação: "A pesar", o peso, "Entregue", "Mercado: x kg") e quanto já foi pesado (ex.: Mercado Teste: 30 kg de morango e 40 kg de abacaxi = 70 kg).

**Iniciar pesagem (botão único).** No topo de Entregas, "Iniciar pesagem" abre a pesagem em tela cheia (`WeighRunScreen`, `useWeighRun`, máquina de estados em `lib/delivery/session`) e percorre todos os produtos do dia, pedido por pedido. Há dois modos, escolhidos em Configurações (padrão: automático):
- **Automático (modo rápido):** quando o peso estabiliza **dentro da faixa**, o app registra e passa ao próximo produto sozinho; fora da faixa nunca registra sozinho e espera a pessoa. A trava só solta quando a balança esvazia (o simulador espera 1,5 s para tirar e colocar o próximo).
- **Manual (por pedido):** a pessoa toca em Registrar em cada produto e, ao fim do pedido, em **Confirmar pedido** antes de ir ao seguinte.
O celular **fala** o mercado e o que pesar ("Empório São José. Coloque na balança 8 quilos de alface."; `expo-speech`, `pt-BR`, `lib/speech`); o botão de voz da tela liga e desliga e **a escolha fica guardada** (`Settings.voice`). A troca de produto usa uma transição suave (`StepTransition`, sai em 140 ms e entra em 280 ms; sem movimento quando "reduzir animações" está ligado).

**Entre um pedido e outro** (fase `between` em `lib/delivery/session`): ao pesar o último produto de um pedido (no modo manual, ao confirmar o pedido), se ainda há outro pedido, a pesagem pausa por **5 segundos** (`BETWEEN_ORDERS_SECONDS`) mostrando o mercado seguinte, quantos produtos e a contagem. "Pesar agora" segue de imediato; "Deixar para depois" (`skipNextOrder`) pula aquele pedido, que continua pendente em Entregas, e vai ao próximo; sem mais pedidos, a pesagem termina. Ao zerar a contagem segue sozinho. A voz anuncia a pausa (`betweenPrompt`).

**Filtro por situação** (`lib/delivery/statusFilter`, segunda linha de chips em Entregas, excludente): **Todos**, **Falta pesar** (tem produto sem peso e ainda não foi à logística) e **Para a logística** (todos os produtos pesados e ainda com o produtor). Vale para a lista, para o total "Separar hoje" e para o que o "Iniciar pesagem" percorre. "Ajustar pesagem" no cartão (só depois de pesar) abre a folha de um pedido.

**Pesar o pedido, produto por produto (folha de ajuste).** "Ajustar pesagem" abre a folha de pesagem (`WeighSheet`) no primeiro produto que falta; ela diz qual produto separar na balança ("Pesar Abacaxi", "Mercado Teste · produto 1 de 2"), o peso esperado e a faixa aceita. Depois de registrar o peso, **Próximo produto** passa ao seguinte, **Anterior** volta, e no último o botão vira **Concluir pesagem**. Na mesma folha a lista "Produtos do pedido" mostra todos os itens com a situação de cada um e permite pular para qualquer um (regras em `lib/delivery/orderFlow`).

**O total do dia fica na mesma tela:** acima dos pedidos, a lista "Separar hoje" (`buildPickList`) soma por produto quanto precisa ser separado no dia (ex.: Abacaxi 40 kg, Morango 30 kg...), com quantos pedidos e quanto falta pesar, para o produtor separar o total e depois distribuir por pedido.

- **Os pedidos são em quilos, não por lote:** a quantidade (caixas, maços...) vira kg por uma tabela (`KG_PER_UNIT`: kg 1, caixa 20, maço 0,4; unidade desconhecida vale 1 kg) e o valor se mantém (`kg ÷ kg por unidade × preço`).
- **Mínimo do produtor** (`judgeProducerWeight`, `lib/delivery/weight.ts`): o produtor só tem **mínimo** (esperado −2%); nunca registra abaixo dele. Se tentar (Registrar, Próximo produto ou o modo automático), abre um aviso (`AlertModal`, `RUN_TEXTS.minimum`) e a pesagem **fica no mesmo item** até chegar ao mínimo. Pode passar do esperado (generosidade do produtor), mas **o que passa não é pago**: o valor é o do peso pedido. O medidor (`WeightGauge openEnded`) mostra "mín." e "ideal", sem "máx.". O **mercado** continua sendo julgado pela faixa completa (−2% / +10%).
- **Peso parado por 5 segundos, carga irregular e confirmação verde** (`lib/delivery/scale`: `STABLE_HOLD_SECONDS`, `holdTick`, `readingSpread`; `lib/delivery/session`: `CELEBRATION_MS`, `celebrationKind`, `celebrationNext`; `StabilityNotice`, `ConfirmationPopup`, `useWeighRun`): depois de o peso estabilizar ele precisa **ficar parado 5 s** com uma contagem na tela (5…1); se voltar a oscilar a contagem recomeça. Enquanto oscila a tela mostra o aviso **"Carga irregular"** (barra laranja com a variação das últimas leituras e o limite aceito) e o botão de baixo fica **laranja, com cadeado e bloqueado** ("Carga irregular"); durante a contagem ele diz "Aguarde N s". Só depois dos 5 s o modo rápido registra sozinho (`shouldAutoRegister` recebeu `held`) e o modo manual libera o Registrar. Ao registrar (modo rápido) ou tocar em Próximo produto (manual) aparece um **pop-up verde** de 3 s ("Alface pesado! · 8 kg registrados · Em seguida: Tomate"); ele cobre a tela, o conteúdo de baixo troca no meio do tempo (1,5 s) e o pop-up some devagar, então o próximo produto nunca aparece de repente. Quando o pedido fecha (último produto no modo rápido; Confirmar pedido no manual) o pop-up é o de **pedido fechado** ("Pedido de X fechado! · 2 produtos · 108 kg · Próximo pedido: Y") e só depois começa a pausa de 5 s entre pedidos. No fim da sessão a tela só fecha depois do pop-up. Enquanto o pop-up está na tela os botões da pesagem não fazem nada. O peso digitado não tem contagem (não oscila).
- **Balança na tela de pesagem:** um selo no canto mostra o **nome da balança conectada** (`scaleChipLabel`, em `WeighRunScreen`); abaixo dele e em Entregas aparece o lembrete de que a configuração da balança fica em **Configurações** (`SCALE_CONFIG_NOTE`).
- **Faixa aceita** (`lib/delivery/weight.ts`): peso esperado −2% / +10%, com limites incluídos e kg arredondado em gramas (`judgeWeight` devolve ABAIXO, NA_FAIXA, ACIMA ou SEM_PESO, a diferença em kg e em %). Por exemplo, para 10 kg aceita de 9,8 a 11. `TOLERANCE_BY_PRODUCT` (vazia) permite uma faixa própria por produto sem mexer em código.
- **Etapa derivada dos fatos** (`stage.ts`, tabela de regras, sem `if` em cadeia): DIVERGENTE (o mercado pesou fora da faixa) > RECEBIDA > COM_LOGISTICA (já entregue) > PRONTA (soma dos lotes dentro da faixa) > A_SEPARAR. Nada é "avançado" na mão: muda o fato, muda a etapa. A **etapa do pedido** é a do item menos avançado que ainda não terminou (`orderStage`); quando todos terminaram, é Divergente se algum item divergiu.
- **Ações do pedido** (tabela em `orders.ts`): Pesar (enquanto não foi à logística), **Entregar o pedido à logística** (só quando todos os produtos têm ao menos um peso; fora da faixa pede uma confirmação mais séria e fica registrado) e Pesagem do mercado. Entregar é por pedido, não por produto.
- **Lotes:** cada produto pode ser pesado em vários lotes; os pesos se somam e dá para remover um lote.
- **O mercado também pesa** ao receber, produto por produto: se o peso de algum sai da faixa, o pedido vira Divergente. No modo simulado há o botão "Simular pesagem do mercado". Pedidos concluídos vão para "Concluídos".
- **Atrasados:** o que passou do dia e não foi entregue continua na lista do primeiro dia, marcado "Atrasado · era para ...".

**Balança (IoT).** `ScaleGateway` entrega leituras (`subscribe(onReading, onConnection)`); o app é que decide se o peso está **estável** (`lib/delivery/scale.ts`: últimas 5 leituras com variação de no máximo 0,02 kg ou 0,2%, e o valor usado é a mediana) e se a balança está **vazia** (abaixo de 50 g). Depois de registrar um lote, o botão fica travado até a balança esvaziar, para o mesmo peso não entrar duas vezes. A `MockScaleService` simula uma balança que oscila e assenta, e a folha de pesagem tem um painel "Simulador de balança" (colocar e tirar peso) que só aparece no modo simulado. O módulo real (ESP32 com célula de carga) **não foi feito**: bastaria uma implementação de `ScaleGateway` (por Bluetooth ou rede), sem mexer nas telas. Bluetooth precisa de build de desenvolvimento (não roda no Expo Go).

**Tela de conexão: feita só no app, com dados simulados (ver "Balança" acima). O que falta é o backend.** Pelo que foi combinado, o módulo será ligado por **Wi‑Fi a um microsserviço**, para o **celular e o site usarem o mesmo caminho** (e não só Bluetooth em cada aparelho). Isso pede, no backend: APIs para o módulo, **vinculadas ao usuário e ao pedido** (qual produtor está pesando qual pedido/produto), e uma **reestruturação do banco de dados** para guardar módulos, sessões de pesagem e leituras. No app bastará outra implementação de `ScaleGateway` (por HTTP/WebSocket) e uma tela para escolher e conectar o módulo; as telas de pesagem não mudam.

### Desfazer

`hooks/useUndo` guarda até 5 ações recentes (`lib/undo/undoStack`), cada uma por **1 minuto**. Quem faz a ação chama `announce({ title, label, revert })`: aparece o aviso verde com o botão "Desfazer" (8 s) e, se o aviso passar, o botão de ajuda passa a oferecer "Desfazer ação recente", que abre a lista (`UndoSheet`, mais recente primeiro). Já desfaz: salvar o catálogo, definir ou remover preço, sugerir produto, editar o perfil e trocar o ícone. Aceitar ou recusar um pedido **não** tem desfazer, de propósito: a recusa já mandou o pedido para outro produtor. Não oferece desfazer quando a ação não tem volta segura (ex.: perfil com troca de senha). Desfazer uma sugestão só funciona no modo simulado; ver "O que ainda é simulado".

### Segurar + e − (sem uso nas telas por ora)

Hoje nenhuma tela edita quantidade (a quantidade vem do pedido do mercado), mas o componente e a regra ficam prontos e testados para quando precisar (por exemplo, kg no pesar). `ui/QuantityInput` usa `hooks/useHoldRepeat` e `lib/produtor/holdRepeat`: um toque muda de 1 em 1; segurando, depois de 0,4 s o número anda sozinho, cada vez mais rápido (de 1 em 1, e depois em passos proporcionais ao pedido para quantidades grandes), e **nunca passa do que falta no pedido** nem de zero. Ao soltar, para. Funciona com o dedo e com o mouse.

### O que ainda é simulado

Todas as telas do Produtor usam dados simulados, mesmo com `EXPO_PUBLIC_USE_MOCKS=false` (em `services/index.ts` só o login e o cadastro têm versão real). Para ligar a API, criar `CatalogService`, `ProposalService` e `ProfileService` e trocá-los na composição:

| Gateway | Endpoint do site |
|---|---|
| `CatalogGateway.listProducts` | `GET /api/produtos` |
| `CatalogGateway.getMyProductIds` / `saveMyProductIds` | `GET` / `POST /api/produtor/meus-produtos` |
| `CatalogGateway.suggestProduct` | `POST /api/produtor/sugestao` |
| `CatalogGateway.listSuggestions` | **não existe** (ver abaixo) |
| `ProposalGateway` (listar, aceitar e recusar propostas) | **não existe** (ver abaixo) |
| `ProfileGateway` | `GET` / `PUT` / `DELETE /api/perfil/meus-dados` |
| `PricingGateway` (preço ofertado, preço sugerido, respostas e vendas) | **não existe** (ver abaixo) |
| `DeliveryGateway` (entregas, pesagens, entrega à logística, recebimento) | **não existe** (ver abaixo) |
| `ScaleGateway` (leituras da balança) | **não existe**: é o módulo ESP32 (ver "Entregas e pesagem") |

**Preços só existem no modo simulado.** O site não tem preço por produto do produtor, preço sugerido, resposta a proposta nem série de vendas; o preço da oferta (`preco`) também não vai na API (`POST /api/produtor/ofertas`). Para valer de verdade o backend precisa de: preço do produtor por produto, guardar as respostas (aceitou/recusou, preço, produto) e calcular o preço sugerido com elas, e vendas por produto e período para o Painel. Do mesmo jeito, **desfazer uma oferta ou uma sugestão** exige endpoints que hoje não existem (cancelar oferta, retirar sugestão); o catálogo e o perfil voltam com os próprios `POST`/`PUT` que já existem.

**Propostas só existem no modo simulado.** O site tem mercados fazendo "demandas" e produtores fazendo "ofertas"; não existe proposta enviada a um produtor por vez, com preço fixo e prazo para responder. Para valer de verdade o backend precisa de: o pedido do mercado com o preço que ele paga; o **disparo para um produtor por vez** com a escada de preços (`lib/pricing/dispatch` documenta a regra e as constantes; **ela deve rodar no servidor**, o app nunca recebe o preço do mercado); o prazo de resposta e a expiração automática; aceitar/recusar (que passa o pedido ao próximo produtor ou à volta ao primeiro); o dia de entrega (terça ou sexta, definido pela administração); e o preço sugerido para os administradores calcularem o preço de venda. O produtor tem **30 minutos** para responder (combinado, já contando o aviso por e-mail). Ele pode aceitar **só parte da quantidade de cada produto**: o backend precisa registrar a quantidade aceita por item e **reenviar o que sobrou a outros produtores** (de novo pela escada de preços), até o pedido ser completado, e dar baixa no pedido do mercado só quando fechar.

**Preços só existem no modo simulado.** O site não tem preço por produto do produtor, preço sugerido, resposta a proposta nem série de vendas. Para valer de verdade o backend precisa de: preço do produtor por produto, guardar as respostas (aceitou/recusou, preço, produto) e calcular o preço sugerido com elas, e vendas por produto e período para o Painel. Desfazer uma **sugestão** de produto exige um endpoint que hoje não existe (retirar sugestão); o catálogo e o perfil voltam com os próprios `POST`/`PUT` que já existem.

**Entregas só existem no modo simulado.** O site não tem entrega por proposta, dia combinado, pesagens nem o peso conferido pelo mercado. As entregas do app nascem dos produtos aceitos de cada pedido (no dia de terça ou sexta dele), com a quantidade aceita, e a pesagem do mercado é simulada por um botão. Para valer de verdade o backend precisa de: o dia de entrega na proposta, o agrupamento por pedido (mercado e dia), o registro das pesagens do produtor por produto (kg, origem balança ou digitada, horário), da entrega do pedido à logística e da pesagem do mercado, e a tabela de kg por unidade e as faixas de tolerância. **As faixas (−2% / +10%) e os kg por unidade (caixa 20, maço 0,4) são suposições a confirmar com o negócio.** Uma balança de verdade também pede cuidado contra fraude (por exemplo, uma "sessão de pesagem" assinada pelo módulo para um peso não poder ser reenviado); isso só está pensado, não feito.

**"Minhas sugestões" só existe no modo simulado.** O modelo `Sugestao` do site não guarda situação: ao aprovar, a linha é apagada e o produto é criado. Para a tela funcionar de verdade o backend precisa de um campo de status (Em análise, Aprovada, Recusada), do motivo da recusa e de um filtro por produtor. Atenção: `GET /api/produtor/sugestao` hoje devolve as sugestões de **todos** os produtores, sem filtro nem autenticação; o app não deve usá-lo como está.

## Android, iOS e tamanhos de tela

As telas são as mesmas nas duas plataformas, sem arquivo `.ios`/`.android`; o que muda fica em poucos pontos, sempre por `Platform.OS`:

- **Teclado:** `BottomSheet`, `FormScreen` e `SuggestionModal` usam `KeyboardAvoidingView` com `padding` no iOS (o teclado cobriria o campo) e nada no Android, como recomenda a documentação do Expo. A folha tira a margem da área do gesto de início enquanto o teclado está aberto. O teclado numérico decimal do iPhone não tem "OK": arrastar a lista (`keyboardDismissMode="on-drag"`) fecha o teclado.
- **Área segura:** a barra de abas, as folhas e o aviso usam `react-native-safe-area-context` (entalhe, ilha dinâmica, barra de gestos e botões do Android). Nada usa medida fixa do aparelho.
- **Texto ampliado do sistema:** o texto cresce junto (iOS "Tamanho do texto", Android "Tamanho da fonte"). Só a barra de abas, que tem altura fixa, limita a 1,3× (`TAB_LABEL_MAX_FONT_SCALE`); os emojis decorativos dentro de caixas fixas não crescem; a legenda da faixa de peso quebra linha.
- **Toque:** alvos de pelo menos 44 pt; os ícones pequenos (conta, limpar busca, preço) ganham `hitSlop`.
- **Telas grandes (iPad, tablet, navegador):** listas e formulários ficam numa coluna de até 720 px, folhas de até 560 px e as abas juntas no centro da barra (até 640 px). O botão Início continua no meio.
- **Voltar do Android:** as folhas e janelas têm `onRequestClose`; na barra, voltar leva ao Painel.
- **Só navegador:** `window.localStorage`, `overflow: "clip"` e a animação de transição ficam atrás de `Platform.OS === "web"`; sombras usam `boxShadow`, que as duas plataformas entendem.

O que foi conferido: o app exporta para web, Android e iOS, e um teste de navegador percorre Painel, Ofertas, Entregas e pesagem em 320, 360, 390, 430, 768 e 1100 px de largura (sem rolagem lateral, barra inteira, botão Início centralizado, folhas dentro da tela, alvos de toque). **Não houve teste em aparelho nem no simulador**: o comportamento do teclado no Android com a tela de borda a borda e o texto ampliado do sistema precisam ser vistos em um celular de verdade.

## Logo e ícones

A logo do time está em `assets/logo` (`logo.svg`, `logocor.svg`, `logo1.png`, `logo1.jpg`, mais `logo-verde.png` e `logo-branca.png`, com fundo transparente, derivadas do `logo1.png`). Dentro do app a marca é desenhada como **vetor** (`components/brand/BrandMark`, caminho em `logoPaths.ts`, tirado do `logo.svg`) com `react-native-svg`: nítida em qualquer tamanho e com a cor do tema (verde, branco sobre fundo verde etc.). Ela substituiu todas as folhas que vinham da biblioteca de ícones (cabeçalho, botão Início, passos do cadastro, folhas flutuantes, assistente, logo animada da entrada). Os arquivos de ícone do aplicativo (`icon.png`, `splash-icon.png`, `favicon.png`, ícone adaptativo do Android em primeiro plano, monocromático e fundo `#357C3A`) foram refeitos a partir dela. O favicon da aba do navegador (`favicon.png`) tem cantos arredondados e fundo transparente nos cantos; os ícones do app continuam quadrados, porque iOS e Android aplicam a própria máscara. No cadastro a logo aparece sem o fundo verde-claro (`BrandHeader framed={false}`); no login e na tela "em análise" ela continua com o fundo. O ícone do Catálogo e o do botão de ajuda "Ajustar meu catálogo" agora são `nutrition-outline` (uma fruta), já que a folha virou a logo.

## Visual (estilo Apple, `theme/`)

O visual segue as regras do skill apple-design (só o texto do skill estava disponível; as páginas de referência da HIG não, então não há citação de página):
- **Cor:** verde da marca `#15803D` (contraste 5,0:1 com branco) para ação principal e para o destaque do Painel (o cartão verde com a receita, único elemento de destaque); âmbar só para atenção; texto secundário com contraste mínimo de 4,5:1. Uma cor significa uma coisa.
- **Tipografia:** corpo de 17 pt, título grande nas abas (`ScreenHeading`), pesos até 700, números em `tabular-nums` (`typography.numeric`).
- **Alvos:** no mínimo 44 pt (botões, chips, linhas de lista, ícone de voz).
- **Superfícies:** sombras suaves (`elevation.card/raised`, `boxShadow`) no lugar de bordas; filetes finos só como separador de lista e rodapé; listas agrupadas (`SettingsGroup`, `SettingsRow`); folhas com alça (`BottomSheet`).
- **Barra de abas:** ícone preenchido na aba ativa.
- **Movimento:** curto e cancelável, respeita "reduzir animações".
- **Ainda não feito:** modo escuro (as cores são constantes; falta um provedor de tema).

## Animações (`components/motion`)

| Componente | O que faz |
|---|---|
| `BrandHeader` | Logo: a folha se desenha ao abrir, balança e gira ao toque. |
| `Reveal` + `staggerDelay` | Entrada suave dos blocos, um após o outro. |
| `PressableScale` | Botões, cartões e caixas afundam e voltam com mola ao toque. |
| `FloatingLeaves` | Folhinhas caindo ao fundo da tela "Conta em Análise". |
| `StepProgress` | A folhinha caminha pela barra até o passo atual. |
| `ScreenTransition` | No navegador, a tela entra deslizando do lado certo ao avançar ou voltar. |
| `usePresence` | Faz algo aparecer e sumir com animação (opções do botão de ajuda, menu do usuário), tirando-o da tela só depois da saída. |
| `StepTransition` | Troca suave entre os itens da pesagem (sai e entra com leve deslize), chaveada pelo passo. |
| `TabBarItem` + `useFocusAnimation` | Aba da barra: a pílula verde atrás do ícone cresce com mola, o ícone sobe um pouco e o texto muda de cor; o botão Início cresce quando está ativo. |
| `ConfirmationPopup` | Pop-up verde da pesagem: aparece em 0,35 s, fica quase opaco enquanto o conteúdo de baixo troca e some em ~1,2 s; uma barrinha enche durante os 3 s. Com "reduzir animações" aparece e some sem movimento, pelo mesmo tempo. |
| `Collapse` | Abre e fecha um bloco animando altura e transparência, para o que vem abaixo descer e subir sem salto (checklist e medidor de senha, "Senhas conferem!"). Roda no JavaScript porque altura não funciona com o driver nativo. |

Nas telas do Produtor, os cartões entram em sequência (`Reveal`), o selo de "marcado" do catálogo estoura com mola e a barra "Salvar Escolhas" sobe do rodapé.

Todas respeitam "reduzir movimento" do aparelho **ou** da opção "Reduzir animações" das Configurações (`useReducedMotion`). Usam a API `Animated` do React Native, sem biblioteca extra de animação.

## Modo simulado

Com `EXPO_PUBLIC_USE_MOCKS=true` no `.env`, o app usa o `MockAuthService` no lugar da API (mesma interface `AuthGateway`, escolhida em `services/index.ts`). Qualquer e-mail e senha entram como produtor aprovado. Cenários pelo início do e-mail: `analise@`, `rejeitado@`, `suspenso@` e `mercado@` reproduzem cada bloqueio; senha `errada` reproduz credenciais inválidas. No cadastro, e-mail começando com `existente` reproduz "e-mail já cadastrado". Para usar a API real: `EXPO_PUBLIC_USE_MOCKS=false`.

## Variáveis de ambiente

O app mobile **não usa o `.env` do app-principal**. Variáveis `EXPO_PUBLIC_*` vão dentro do app instalado e qualquer pessoa consegue lê-las, então segredos nunca entram aqui.

| Onde | Variáveis |
|---|---|
| `app-mobile/.env` | `EXPO_PUBLIC_USE_MOCKS`, `EXPO_PUBLIC_API_URL` |
| `app-principal/.env` (servidor) | `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `MICROSERVICE_URL`, `ADMIN_SENHA_INICIAL`, `CORS_ALLOWED_ORIGIN` (só para testar o app no navegador) |

Toda leitura de ambiente passa por `src/config/env.ts`. Para conectar à API real, basta `EXPO_PUBLIC_USE_MOCKS=false` e a URL do servidor; nenhuma tela muda.

## Como adicionar uma feature (padrão por story)

1. **Tipos** em `src/types/<feature>.ts`, espelhando o JSON da API.
2. **Gateway** (interface) em `src/services/<Feature>Gateway.ts`, só com o que a tela precisa.
3. **Teste primeiro** da implementação real (`<Feature>Service`, usando `ApiClient` com fake) e da simulada.
4. **Implementações:** `<Feature>Service` (API real) e `Mock<Feature>Service` (dados fictícios).
5. **Composição** em `src/services/index.ts`: `env.useMocks ? Mock... : Service...`, um `getXService()` por feature.
6. **Controller** em `src/hooks/use<Feature>.ts` consome o gateway; a **tela** em `src/app` só renderiza.

Assim, ligar a API real de qualquer feature é trocar a implementação na composição, sem mexer em hooks nem telas.

## Atualizando a pasta com uma versão nova

Ao extrair um ZIP novo por cima da pasta antiga, arquivos que foram apagados ou movidos continuam lá. Duas telas com o mesmo endereço (por exemplo `(produtor)/mural.tsx` e `(produtor)/(tabs)/mural.tsx`) fazem o app abrir sem barra de abas e sem o ícone da conta, e podem dar erros de props. O teste `src/lib/routes/appTree.test.js` (`npm test`) acusa isso e diz quais arquivos apagar; ele também acusa as telas que saíram do app (`(tabs)/mural.tsx`, que virou Ofertas, e `simulador-preco.tsx`), que reapareceriam como uma aba a mais ou uma rota fantasma. Por segurança, a barra de abas só mostra as telas da lista `PRODUCER_TABS` (`visibleTabs` em `lib/produtor/tabs`): um arquivo velho que sobrar na pasta não vira mais um botão "mural" na barra, mas **continue apagando a pasta `src` antes de extrair**. Nesta versão, apague também os arquivos antigos de `src` (Mural, negociação, demandas) ao atualizar. O jeito mais seguro é apagar a pasta `src` antes de extrair (guarde o `.env`; `node_modules` pode ficar).

## Comandos

```bash
npm install
cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL
npm test                 # Jest
npm run typecheck        # TypeScript
npx expo start
```
