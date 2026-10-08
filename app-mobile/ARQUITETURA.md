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

## Transição entre telas de entrada

Login, cadastro, passo 2 e "Conta em Análise" têm uma posição no fluxo (`components/motion/screenTransition.ts`). Avançar entra deslizando pela direita; voltar entra pela esquerda. No celular quem anima é a pilha nativa (`slide_from_right`); no navegador o `ScreenTransition` (aplicado pelo `screenLayout` do `(auth)/_layout`) faz o mesmo com `Animated`. A lógica de direção é uma função pura com teste.

## Área do Produtor (`src/app/(produtor)`)

O app é só do Produtor. Telas de Mercado não existem aqui.

```
(produtor)/_layout.tsx      guarda de sessão + provedores + Stack + botão de ajuda (AssistantHost)
  (tabs)/_layout.tsx        quatro abas: Mural, Catálogo, Ofertas, Painel; ícone da conta no cabeçalho
    mural · catalogo · ofertas · painel
  perfil.tsx                "Meu Perfil" (abre por cima das abas, com seta de voltar)
  configuracoes.tsx         "Configurações" (idem)
```

| Parte | Onde | O que faz |
|---|---|---|
| Regras de domínio | `lib/produtor`, `lib/assistant`, `lib/settings` | Funções puras e testadas: o que falta em um pedido, o que aparece no Mural e em Ofertas, busca/filtro/ordem do catálogo (`catalogView`) e dos pedidos (`demandView`), resumo do painel (`dashboard`), status das sugestões, iniciais do ícone, opções do botão de ajuda por tela, configurações do app. |
| Gateways | `services/CatalogGateway`, `DemandGateway`, `ProfileGateway`, `AssistantGateway` | Contratos do que as telas precisam. Cada um tem versão simulada; o assistente já é um contrato assíncrono para um chatbot de verdade entrar depois sem mexer nas telas. |
| Dados simulados | `services/Mock*Service`, `FixedAssistantService`, `src/mocks` | 18 produtos, 10 pedidos, 3 sugestões e um perfil de exemplo, com atraso para parecer rede. |
| Textos | `src/content` | Perguntas e respostas da Ajuda (`helpTopics`), nomes das ordens e filtros (`listOptions`), itens do menu do usuário (`userMenu`), contato do suporte. |
| Provedores | `useProdutorData`, `useProducerIdentity`, `useAssistant` | Dados compartilhados entre as abas; nome e ícone do produtor; estado do botão de ajuda. |
| Controllers | `useMuralScreen`, `useCatalogScreen`, `useOffersScreen`, `useDashboardScreen`, `useProfileScreen`, `useSettingsScreen`, `useHelpChat`, `useMySuggestions`, `useUserMenu`, `useSuggestionForm` | Estado e fluxo de cada tela ou janela. As telas só renderizam. |
| Avisos | `hooks/useToast` + `ToastBanner` | Aviso rápido no topo ("Catálogo salvo!"), como o sonner do site. |

Regras de comportamento: o Mural mostra só pedidos dos produtos **já salvos** no catálogo (marcar sem salvar não muda o Mural); sem nenhum produto salvo ele fica "escondido" e leva ao Catálogo; a barra "Salvar Escolhas" só aparece quando há mudança; a quantidade de uma oferta nunca passa do que falta no pedido. Os filtros do catálogo agem sobre a seleção em andamento, não só a salva.

### Botão de ajuda (`components/assistant`)

Botão redondo no canto inferior direito, visível em **todas as telas do Produtor** (fica no layout, acima da pilha). Abre opções que mudam conforme a tela (`lib/assistant/fabActions.ts`, uma tabela tela → opções):

| Tela | Opções |
|---|---|
| Catálogo | Sugerir produto · Minhas sugestões · Ajuda |
| Mural | Ajustar meu catálogo · Ajuda |
| Ofertas, Painel | Ver pedidos do Mural · Ajuda |
| Meu Perfil, Configurações | Ajuda |

Todas trazem "Esconder botão": ele se recolhe na lateral, deixando só uma abinha, e volta com um toque. Detalhes de convivência com o resto da tela: sobe sozinho quando aparece uma barra fixa (`useFabLift`, usado pelo `SaveBar`), some com o teclado aberto, e as listas deixam folga no fim (`bottomSpace`) para o último item nunca ficar embaixo dele. **Ajuda** é um mini chat com perguntas fixas (`FixedAssistantService`); as da tela atual vêm primeiro. Para trocar por um chatbot de verdade, basta outra implementação de `AssistantGateway` em `services/index.ts`.

### Painel, menu do usuário e Configurações

- **Painel** (4ª aba): receita estimada (quantidade ofertada × preço médio do pedido), três contadores que levam às outras telas, gráfico de barras de uma série (receita por produto, até 5 produtos + "Outros produtos") e as maiores oportunidades do Mural. Tudo calculado com dados que o app já carregou; não há endpoint novo.
- **Menu do usuário:** o círculo no canto do cabeçalho das abas (onde ficava o "Sair") mostra as iniciais ou o ícone que o produtor escolheu e abre um menu suspenso logo abaixo dele: Meu Perfil, Configurações, Ajuda e Sair da conta (com confirmação). O atalho de Acessibilidade entra em `content/userMenu.ts` no futuro.
- **Ícone da conta:** escolhido em Meu Perfil, entre as iniciais e 10 desenhos. Fica guardado no aparelho, por e-mail (`Settings.avatars`); o site ainda não tem esse campo.
- **Configurações:** Acessibilidade ("Reduzir animações", somado ao que o aparelho já pede), Privacidade (Termos de Uso e Política) e Conta (Meu Perfil, Suporte, Sair).

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

**"Minhas sugestões" só existe no modo simulado.** O modelo `Sugestao` do site não guarda situação: ao aprovar, a linha é apagada e o produto é criado. Para a tela funcionar de verdade o backend precisa de um campo de status (Em análise, Aprovada, Recusada), do motivo da recusa e de um filtro por produtor. Atenção: `GET /api/produtor/sugestao` hoje devolve as sugestões de **todos** os produtores, sem filtro nem autenticação; o app não deve usá-lo como está.

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
