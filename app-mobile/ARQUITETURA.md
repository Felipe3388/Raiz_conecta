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
  (tabs)/_layout.tsx        barra com quatro abas (Mural, Catálogo, Ofertas, Entregas) e o botão redondo Início no meio; ícone da conta no cabeçalho
    painel (tela inicial) · mural · catalogo · ofertas · entregas
  perfil.tsx                "Meu Perfil" (abre por cima das abas, com seta de voltar)
  configuracoes.tsx         "Configurações" (idem)
  simulador-preco.tsx       "Simulador de preço", tela de teste do leilão inverso (aberta pelas Configurações)
```

| Parte | Onde | O que faz |
|---|---|---|
| Regras de domínio | `lib/produtor`, `lib/pricing`, `lib/delivery`, `lib/undo`, `lib/assistant`, `lib/settings` | Funções puras e testadas: o que falta em um pedido, o que aparece no Mural e em Ofertas, busca/filtro/ordem do catálogo (`catalogView`) e dos pedidos (`demandView`), resumo do painel (`dashboard`), preço sugerido, negociação e preços × vendas (`lib/pricing`), entregas e pesagem (`lib/delivery`, ver "Entregas e pesagem"), pilha de desfazer (`undoStack`), segurar + e − (`holdRepeat`), status das sugestões, iniciais do ícone, opções e posição do botão de ajuda (`fabActions`, `fabPlacement`), configurações do app. |
| Gateways | `services/CatalogGateway`, `DemandGateway`, `ProfileGateway`, `PricingGateway`, `DeliveryGateway`, `ScaleGateway`, `AssistantGateway` | Contratos do que as telas precisam. Cada um tem versão simulada; o assistente já é um contrato assíncrono para um chatbot de verdade entrar depois sem mexer nas telas. |
| Dados simulados | `services/Mock*Service`, `FixedAssistantService`, `src/mocks` | 18 produtos, 10 pedidos, 3 sugestões, preços e vendas de exemplo e um perfil de exemplo, com atraso para parecer rede. |
| Textos | `src/content` | Perguntas e respostas da Ajuda (`helpTopics`), nomes das ordens e filtros (`listOptions`), itens do menu do usuário (`userMenu`), frases dos preços e vendas (`priceTexts`), etapas, faixas e avisos das entregas (`deliveryTexts`), contato do suporte. |
| Provedores | `useProdutorData`, `usePricing`, `useDeliveries`, `useUndo`, `useProducerIdentity`, `useAssistant` | Dados compartilhados entre as abas; preços (ofertado, sugerido, mercado); entregas e pesagens; ações que dá para desfazer; nome e ícone do produtor; estado e posição do botão de ajuda. |
| Controllers | `useMuralScreen`, `useCatalogScreen`, `useOffersScreen`, `useDashboardScreen`, `useEntregasScreen`, `useWeighSheet`, `useScale`, `useProfileScreen`, `useSettingsScreen`, `useSimulatorScreen`, `useNegotiation`, `usePriceEditing`, `usePriceForm`, `useHoldRepeat`, `useHelpChat`, `useMySuggestions`, `useUserMenu`, `useSuggestionForm` | Estado e fluxo de cada tela ou janela. As telas só renderizam. |
| Avisos | `hooks/useToast` + `ToastBanner` | Aviso rápido no topo ("Catálogo salvo!"), como o sonner do site. Pode trazer um botão (usado pelo "Desfazer"). |

Regras de comportamento: o Mural mostra só pedidos dos produtos **já salvos** no catálogo (marcar sem salvar não muda o Mural); sem nenhum produto salvo ele fica "escondido" e leva ao Catálogo; a barra "Salvar Escolhas" só aparece quando há mudança; a quantidade de uma oferta nunca passa do que falta no pedido. Os filtros do catálogo agem sobre a seleção em andamento, não só a salva.

### Botão de ajuda (`components/assistant`)

Botão redondo, visível em **todas as telas do Produtor** (fica no layout, acima da pilha). Começa no canto inferior direito. Abre opções que mudam conforme a tela (`lib/assistant/fabActions.ts`, uma tabela tela → opções):

| Tela | Opções |
|---|---|
| Catálogo | Sugerir produto · Minhas sugestões · Ajuda |
| Mural | Ajustar meu catálogo · Ajuda |
| Ofertas, Painel | Ver pedidos do Mural · Ajuda |
| Entregas | Ajuda |
| Meu Perfil, Configurações, Simulador de preço | Ajuda |

Em qualquer tela, enquanto houver algo para desfazer, entra **Desfazer ação recente** antes da Ajuda (ver "Desfazer"). Todas trazem "Mudar de lado" e "Esconder botão".

**Reposicionável, como o AssistiveTouch do iPhone.** Dá para arrastar o botão para qualquer altura da tela; ao soltar ele gruda na lateral mais perto (`snapPlacement`). "Esconder botão" o recolhe na lateral, deixando só uma abinha de 30 px, que também pode ser arrastada (escondida, ela muda de lado e de altura sem aparecer), e um toque o mostra de novo. "Mudar de lado" é a alternativa a arrastar para quem não consegue. A posição é guardada nas configurações como lado + altura em proporção de 0 a 1 (`Settings.fabPlacement`), então vale para qualquer tamanho de tela; o "escondido" não é guardado. Toda a conta (onde ele fica, para onde as opções abrem, quanto sobe por uma barra) é função pura em `lib/assistant/fabPlacement.ts`.

Convivência com o resto da tela: sobe sozinho quando aparece uma barra fixa embaixo e ele está perto dela (`useFabLift`, usado pelo `SaveBar`; lá em cima a barra não o afeta), some com o teclado aberto, as opções abrem para cima ou para baixo conforme o espaço, e as listas deixam folga no fim (`bottomSpace`) para o último item nunca ficar embaixo dele.

Cuidados que valem para o navegador (descobertos nos testes):

- O arrastar só "pega" depois de o dedo andar 6 px, para o toque simples continuar abrindo o menu. O `PanResponder` zera a conta ao pegar, então `fabPlacement.dragPoint` soma o que o dedo já andou; sem isso o botão ficava atrás do dedo.
- O navegador consulta o arrastar só enquanto o cursor está sobre o botão. Um mouse muito rápido logo no começo, sobretudo na abinha de 30 px, pode não pegar; é só repetir mais devagar. No celular não acontece.
- Soltar o mouse com o cursor ainda sobre o botão gera um clique; ele é ignorado por 250 ms depois de soltar, senão o menu abriria a cada arrastada.
- A camada do botão usa `overflow: "clip"` no navegador (`hidden` ainda deixa o navegador rolar o conteúdo e o botão escondido ficava no meio do caminho). O menu tem a largura útil da tela; sem isso as opções de texto longo vazavam pela lateral. **Ajuda** é um mini chat com perguntas fixas (`FixedAssistantService`); as da tela atual vêm primeiro. Para trocar por um chatbot de verdade, basta outra implementação de `AssistantGateway` em `services/index.ts`.

### Painel, menu do usuário e Configurações

- **Painel** (tela inicial, botão Início): cartão "Entregas de hoje" que leva à aba Entregas, receita estimada (quantidade ofertada × preço combinado ou, sem preço, o do pedido), três contadores que levam às outras telas, gráfico de barras de uma série (receita por produto, até 5 produtos + "Outros produtos"), as maiores oportunidades do Mural e **Preços e vendas** (ver "Preço e leilão inverso"). A parte de preços e vendas usa os dados simulados do `PricingGateway`; o resto é calculado com o que o app já carregou.
- **Menu do usuário:** o círculo no canto do cabeçalho das abas (onde ficava o "Sair") mostra as iniciais ou o ícone que o produtor escolheu e abre um menu suspenso logo abaixo dele: Meu Perfil, Configurações, Ajuda e Sair da conta (com confirmação). O atalho de Acessibilidade entra em `content/userMenu.ts` no futuro.
- **Ícone da conta:** escolhido em Meu Perfil, entre as iniciais e 10 desenhos. Fica guardado no aparelho, por e-mail (`Settings.avatars`); o site ainda não tem esse campo.
- **Configurações:** Acessibilidade ("Reduzir animações", somado ao que o aparelho já pede), Privacidade (Termos de Uso e Política), Conta (Meu Perfil, Suporte, Sair) e Testes ("Simulador de preço").

### Preço e leilão inverso

Há **dois preços que não se misturam**:

- **Preço ofertado:** o que o produtor pede por unidade de cada produto (y). Ele define no Catálogo, pelo lápis "Definir preço" / "R$ x" de cada produto marcado, e pode mudar também no Mural e na negociação (`PriceSheet`, mesmo controller `usePriceEditing`). Vale por produto, não por pedido.
- **Preço sugerido:** a média da plataforma, só uma referência (aparece como "Média sugerida" e nunca vira o preço do produtor sozinho).

No Mural cada pedido mostra o que o mercado paga (x) contra o preço do produtor (y) e se cabe (`lib/pricing/fit`). Ao **Ofertar** um produto que tem preço, abre a negociação (`NegotiationSheet`, regra em `lib/pricing/negotiation`):

1. O sistema começa baixo, a 80% do preço sugerido, e sobe em degraus iguais, no máximo 5 propostas.
2. O teto é o menor entre o que o pedido paga (x) e o que o produtor pede (y).
3. **Uma proposta de cada vez, sem lista para escolher.** O produtor só responde se aceita (fecha ali) ou recusa ("Recusar, quero mais"); as propostas futuras ficam escondidas (`visibleRounds`). Se ele escolhesse entre opções, pegaria sempre a mais cara, e o leilão perderia o sentido. Chegou à proposta igual ao preço dele, o acordo fecha sozinho; se o pedido paga menos do que ele pede e ele recusa tudo, termina "sem acordo" e pode mudar o próprio preço.
4. **Pausa depois de recusar** (`REFUSAL_PAUSE_MS`, 5 s): a próxima proposta, mais alta, só chega depois dela, com a contagem na tela. Nesse tempo ele pode tocar em **"Mudei de ideia: aceitar R$ x"** e fechar no preço que acabou de recusar (`reconsiderLast`). A recusa só é contada para o preço sugerido quando a pausa termina; quem volta atrás fica só com o aceite. A pausa é uma constante e `useNegotiation` aceita outro valor.
5. O acordo vira a oferta, com o preço combinado, e o Painel passa a usar esse preço.

**Como o preço sugerido aprende** (`lib/pricing/suggestion`): parte da média dos preços que os produtores definiram (descartando os que fogem de 0,5× a 2× a mediana) e cada resposta puxa a média 30% na sua direção: uma recusa acima da média a empurra para cima (com 5% de margem), um aceite abaixo dela a puxa para baixo. Recusa abaixo da média não a mexe. É um primeiro protótipo transparente e testado, feito para ser trocado por algo melhor quando houver base de dados de verdade.

**Painel, "Preços e vendas"** (`lib/pricing/insights`): para cada produto que o produtor cultiva, compara o preço dele com a média vendida (ponderada pelo volume) e a venda do período com o anterior (a partir de 5% de diferença é "vendendo mais" ou "menos"; até 3% do preço é "na média"). A frase final diz o que fazer: definir preço, baixar, subir ou manter.

**Simulador de preço** (Configurações → Testes): tela de teste com um pedido de mentira (x e y editáveis) para ver a negociação inteira. Só nele aparece a lista das propostas que o mercado fará, por ser uma ferramenta de teste. Com "Guardar as respostas" ligado, as respostas ajustam de verdade o preço sugerido do produto (mostra "antes → agora"); desligado, é só um teste.

### Navegação: barra com o botão Início (`ProducerTabBar`)

O login sempre cai no **Painel** (`app/index.tsx` e o redirecionamento do `(auth)/_layout` apontam para `/painel`; `initialRouteName="painel"`). A barra tem as quatro abas, duas de cada lado (Mural, Catálogo, Ofertas, Entregas), e no meio um **botão redondo Início**, um pouco acima das outras, que leva ao Painel. `lib/produtor/tabs.ts` (`splitTabs`) decide quais ficam à esquerda e à direita e qual é a "casa" (`HOME_ROUTE`). Voltar (`backBehavior="initialRoute"`) leva ao Painel.

Cuidados descobertos nos testes: o toque só chega a um botão que está **dentro da área do pai**, então a barra é uma view alta (faixa transparente de 20 px + 70 px de barra) e o botão é filho direto dela, em vez de "vazar" para fora. No navegador a seleção vai em `aria-selected` (o `accessibilityState` não vira atributo). A aba Entregas mostra o número de entregas a fazer hoje (`pendingCount`) e a Mural o de pedidos abertos, com nomes completos para leitor de tela ("Entregas, 1 para fazer hoje"). O botão de ajuda considera só os 70 px da barra (`TAB_BAR_CONTENT_HEIGHT`).

### Entregas e pesagem (`lib/delivery`, `components/entregas`)

Cada oferta do produtor vira **uma entrega** (o id é o do pedido), com um dia marcado. A aba **Entregas** mostra primeiro o que **separar no dia** somando os pedidos (lista de separação, `buildPickList`) e depois a lista **por pedido**. Os pedidos são em **quilos, não por lote**: a quantidade ofertada (caixas, maços...) vira kg por uma tabela (`KG_PER_UNIT`: kg 1, caixa 20, maço 0,4; unidade desconhecida vale 1 kg) e o valor da oferta se mantém (`kg ÷ kg por unidade × preço`).

- **Faixa aceita** (`lib/delivery/weight.ts`): peso esperado −2% / +10%, com limites incluídos e kg arredondado em gramas (`judgeWeight` devolve ABAIXO, NA_FAIXA, ACIMA ou SEM_PESO, a diferença em kg e em %). Por exemplo, para 10 kg aceita de 9,8 a 11. `TOLERANCE_BY_PRODUCT` (vazia) permite uma faixa própria por produto sem mexer em código.
- **Etapa derivada dos fatos** (`stage.ts`, tabela de regras, sem `if` em cadeia): DIVERGENTE (o mercado pesou fora da faixa) > RECEBIDA > COM_LOGISTICA (já entregue) > PRONTA (soma dos lotes dentro da faixa) > A_SEPARAR. Nada é "avançado" na mão: muda o fato, muda a etapa. Uma segunda tabela diz que ações cada etapa permite (Pesar, Entregar à logística, Pesagem do mercado).
- **Lotes:** o produtor pode pesar em vários lotes; os pesos se somam e dá para remover um lote. A folha de pesagem (`WeighSheet`) mostra a faixa, o peso da balança ou digitado, quanto falta ou passou e se o total fica dentro. Entregar com o peso fora da faixa é permitido depois de uma confirmação e fica marcado ("entregue fora da faixa").
- **Dias:** chips Hoje, Amanhã, os próximos dias com entregas e "Concluídas". O que passou do dia e não foi entregue continua em Hoje, marcado "Atrasada".
- **O mercado também pesa** ao receber: se o peso dele sai da faixa a entrega vira Divergente. No modo simulado há o botão "Simular pesagem do mercado".

**Balança (IoT).** `ScaleGateway` entrega leituras (`subscribe(onReading, onConnection)`); o app é que decide se o peso está **estável** (`lib/delivery/scale.ts`: últimas 5 leituras com variação de no máximo 0,02 kg ou 0,2%, e o valor usado é a mediana) e se a balança está **vazia** (abaixo de 50 g). Depois de registrar um lote, o botão fica travado até a balança esvaziar, para o mesmo peso não entrar duas vezes. A `MockScaleService` simula uma balança que oscila e assenta, e a folha de pesagem tem um painel "Simulador de balança" (colocar e tirar peso) que só aparece no modo simulado. O módulo real (ESP32 com célula de carga) **não foi feito**: bastaria uma implementação de `ScaleGateway` (por Bluetooth ou rede), sem mexer nas telas. Bluetooth precisa de build de desenvolvimento (não roda no Expo Go).

### Desfazer

`hooks/useUndo` guarda até 5 ações recentes (`lib/undo/undoStack`), cada uma por **1 minuto**. Quem faz a ação chama `announce({ title, label, revert })`: aparece o aviso verde com o botão "Desfazer" (8 s) e, se o aviso passar, o botão de ajuda passa a oferecer "Desfazer ação recente", que abre a lista (`UndoSheet`, mais recente primeiro). Já desfaz: salvar o catálogo, definir ou remover preço, ofertar (inclusive o acordo da negociação), sugerir produto, editar o perfil e trocar o ícone. Não oferece desfazer quando a ação não tem volta segura (ex.: perfil com troca de senha). Desfazer uma oferta ou uma sugestão só funciona no modo simulado; ver "O que ainda é simulado".

### Segurar + e −

`ui/QuantityInput` usa `hooks/useHoldRepeat` e `lib/produtor/holdRepeat`: um toque muda de 1 em 1; segurando, depois de 0,4 s o número anda sozinho, cada vez mais rápido (de 1 em 1, e depois em passos proporcionais ao pedido para quantidades grandes), e **nunca passa do que falta no pedido** nem de zero. Ao soltar, para. Funciona com o dedo e com o mouse.

### O que ainda é simulado

Todas as telas do Produtor usam dados simulados, mesmo com `EXPO_PUBLIC_USE_MOCKS=false` (em `services/index.ts` só o login e o cadastro têm versão real). Para ligar a API, criar `CatalogService`, `DemandService` e `ProfileService` e trocá-los na composição:

| Gateway | Endpoint do site |
|---|---|
| `CatalogGateway.listProducts` | `GET /api/produtos` |
| `CatalogGateway.getMyProductIds` / `saveMyProductIds` | `GET` / `POST /api/produtor/meus-produtos` |
| `CatalogGateway.suggestProduct` | `POST /api/produtor/sugestao` |
| `CatalogGateway.listSuggestions` | **não existe** (ver abaixo) |
| `DemandGateway.listDemands` | `GET /api/mercado/demandas` (o site filtra no cliente) |
| `DemandGateway.sendOffer` | `POST /api/produtor/ofertas` |
| `ProfileGateway` | `GET` / `PUT` / `DELETE /api/perfil/meus-dados` |
| `PricingGateway` (preço ofertado, preço sugerido, respostas e vendas) | **não existe** (ver abaixo) |
| `DeliveryGateway` (entregas, pesagens, entrega à logística, recebimento) | **não existe** (ver abaixo) |
| `ScaleGateway` (leituras da balança) | **não existe**: é o módulo ESP32 (ver "Entregas e pesagem") |

**Preços só existem no modo simulado.** O site não tem preço por produto do produtor, preço sugerido, resposta a proposta nem série de vendas; o preço da oferta (`preco`) também não vai na API (`POST /api/produtor/ofertas`). Para valer de verdade o backend precisa de: preço do produtor por produto, guardar as respostas (aceitou/recusou, preço, produto) e calcular o preço sugerido com elas, e vendas por produto e período para o Painel. Do mesmo jeito, **desfazer uma oferta ou uma sugestão** exige endpoints que hoje não existem (cancelar oferta, retirar sugestão); o catálogo e o perfil voltam com os próprios `POST`/`PUT` que já existem.

**Entregas só existem no modo simulado.** O site não tem entrega por oferta, dia combinado, pesagens nem o peso conferido pelo mercado. As entregas do app nascem das ofertas (as duas do exemplo vencem hoje e amanhã; as novas, daqui a 2 dias), e a pesagem do mercado é simulada por um botão. Para valer de verdade o backend precisa de: data de entrega na oferta, registro das pesagens do produtor (kg, origem balança ou digitada, horário), da entrega à logística e da pesagem do mercado, e a tabela de kg por unidade e as faixas de tolerância. **As faixas (−2% / +10%) e os kg por unidade (caixa 20, maço 0,4) são suposições a confirmar com o negócio.** Uma balança de verdade também pede cuidado contra fraude (por exemplo, uma "sessão de pesagem" assinada pelo módulo para um peso não poder ser reenviado); isso só está pensado, não feito.

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

O que foi conferido: o app exporta para web, Android e iOS, e um teste de navegador percorre Painel, Entregas, pesagem e negociação em 320, 360, 390, 430, 768 e 1100 px de largura (sem rolagem lateral, barra inteira, botão Início centralizado, folhas dentro da tela, alvos de toque). **Não houve teste em aparelho nem no simulador**: o comportamento do teclado no Android com a tela de borda a borda e o texto ampliado do sistema precisam ser vistos em um celular de verdade.

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

Ao extrair um ZIP novo por cima da pasta antiga, arquivos que foram apagados ou movidos continuam lá. Duas telas com o mesmo endereço (por exemplo `(produtor)/mural.tsx` e `(produtor)/(tabs)/mural.tsx`) fazem o app abrir sem barra de abas e sem o ícone da conta, e podem dar erros de props. O teste `src/lib/routes/appTree.test.js` (`npm test`) acusa isso e diz quais arquivos apagar. O jeito mais seguro é apagar a pasta `src` antes de extrair (guarde o `.env`; `node_modules` pode ficar).

## Comandos

```bash
npm install
cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL
npm test                 # Jest
npm run typecheck        # TypeScript
npx expo start
```
