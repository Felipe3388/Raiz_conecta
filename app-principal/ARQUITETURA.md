# Arquitetura do app-principal (site + API)

Next.js 16 (App Router) com React 19 e TypeScript. O mesmo projeto serve as **telas do site** e a **API** que o
app mobile e o módulo da balança (ESP32) usam. A organização segue a do app mobile (`app-mobile/ARQUITETURA.md`):
**regras puras** em `lib`, **controllers** em hooks, **telas** que só montam componentes.

## Camadas

```
src/
  app/                 Rotas (Next). page.tsx = tela; api/**/route.ts = endpoint. Nada de regra de negócio aqui.
  components/
    ui/                Kit visual sem regra de negócio (botão, campo, cartão, modal, lista...). Reutilize antes de criar.
    brand/             Logo do Raiz Conecta (o mesmo desenho do app), marca "RaizConecta", folhinhas animadas.
    forms/             Blocos de formulário que se repetem (endereço com busca de CEP).
    legal/             Janela de documento (Termos, Privacidade).
    auth/ admin/ mercado/ produtor/ perfil/ balanca/   Componentes de cada área.
  content/             Textos longos (Termos, Privacidade). Texto muda sem mexer em componente.
  hooks/               Controllers das telas: estado, chamadas à API e fluxo (useProfileForm, useScales...).
  lib/                 Regras puras e testadas (validação, máscaras, cálculos, contratos da API) e o servidor:
    api/http.ts        Respostas padrão das rotas: fail(), serverError(), text()...
    auth/              JWT, sessão (requireSession), rascunho do cadastro.
    http/client.ts     api(): o único jeito de as telas chamarem a API (nunca lança; 401 leva ao login).
    iot/               Balança: id (MAC), código da etiqueta, leituras, peso ao vivo.
    ...                Uma pasta por assunto (perfil, mercado, produtor, admin, format, validation...).
  proxy.ts             (antigo middleware.ts) Separa /admin, /produtor, /catalogo e /checkout por perfil; CORS da API.
```

Regra de dependência: `app` → `components` / `hooks` → `lib`. `lib` não importa React nem componentes;
`components/ui` não chama a API.

## Telas e seus controllers

| Tela | Rota | Controller / regras |
|---|---|---|
| Login e cadastro (passo 1) | `/login` | `useLoginForm`, `SignupForm`, `lib/validation/auth` |
| Cadastro (passo 2) | `/completar-perfil` | `useCompleteSignup`, `lib/auth/signupForm`, `AddressFields` |
| Cadastro enviado | `/cadastro-enviado` | `AccountReview` (mesma animação do app: logo, folhas, envelope) |
| Meu perfil do mercado | `/perfil` | `useProfileForm` + `ProfileEditor`, `lib/perfil/form` |
| Área do produtor | `/produtor/*` | `ProdutorProvider` (carrega o produtor e o mural uma vez), `ProdutorShell` (menu) |
| Meu Perfil do produtor | `/produtor/perfil` | o mesmo `useProfileForm` + `ProfileEditor` |
| Minha balança | `/produtor/balancas` | `useScales`, `useLiveWeight`, `lib/iot/label`, `lib/iot/liveWeight` |
| Mercado | `/catalogo`, `/checkout` | `useMercadoData`, `useCart`, `lib/mercado/*` |
| Administração | `/admin` | `useAdminData` e uma aba por arquivo em `components/admin` |

As telas do produtor têm os mesmos nomes e a mesma ordem das abas do app (`lib/produtor/nav.ts`).
Perfil e Minha balança abrem a partir do **Mais**, como no celular (`MORE_SCREENS`).

## Kit de componentes (`components/ui`)

| Componente | Para quê |
|---|---|
| `Button`, `Input`, `Select`, `PasswordField` (auth) | Controles básicos, com rótulo e mensagem ligados ao campo |
| `QuantityInput` | O único campo de quantidade (− / número / +). Digitar só vale ao sair do campo ou com Enter |
| `SectionCard` | Bloco com título e ícone. Com `description`, ganha o cabeçalho destacado dos formulários longos |
| `FormBlock` | Grupo de campos (fieldset) com título |
| `PageHeading` | Título da tela + linha de apoio + ação à direita |
| `ListGroup` / `ListRow` | Lista agrupada do Mais (linhas de 56 px, link ou ação) |
| `StatTile` (link) / `StatCard` (admin) | Um número em destaque |
| `Modal`, `ConfirmModal`, `useConfirm` | Janelas (Esc fecha, foco preso, a página de trás não rola: `useDialog`) |
| `FileDrop`, `PhotoField` | Anexar documento / escolher foto, com a conferência de tipo e tamanho |
| `EmptyState`, `PageLoader`, `StatusBanner`, `Badge`, `TabNav`, `SearchBar`, `InfoRow`, `ProgressBar`, `StarRating` | Estados e detalhes de tela |

Cores: verde (`green-*`) é a ação principal, âmbar é aviso, vermelho é perigo, azul é informação.
Classes `.rc-*` em `app/globals.css` guardam padrões usados por vários componentes.

## API (rotas)

Toda rota segue o mesmo padrão (`src/app/api/**/route.ts`):

1. `requireSession(req, ["produtor"])` — quem é e se pode (o e-mail vem **sempre** da sessão).
2. Ler e validar a entrada com funções de `lib/` (nunca confiar no corpo).
3. Gravar com Prisma; várias tabelas juntas → `prisma.$transaction`.
4. Responder com `NextResponse.json(...)`; erro esperado → `fail(status, "mensagem")`; inesperado →
   `serverError("evento", error)` (log JSON + 500 sem detalhes).

Recurso de outra pessoa responde 404 (não revela o que existe). Tentativas repetidas (login, troca de senha e
código da etiqueta da balança) passam por `lib/security/rateLimit.ts`.

Cada rota nova precisa de teste (`route.test.ts` ao lado) e de entrada no Swagger: edite
`scripts/build-swagger.mjs` e rode `npm run docs:api`. O teste `src/swagger.test.ts` falha se faltar documentação.

## Contratos compartilhados com o app mobile

O app usa a mesma API. Os formatos que os dois precisam entender igual:

| Assunto | Site | App |
|---|---|---|
| Balança (ScaleLink, ScaleState) | `lib/iot/label.ts`, `lib/iot/scales.ts` | `types/scaleLink.ts`, `lib/delivery/scaleLink.ts` |
| Peso ao vivo (`/leitura`) | `lib/iot/liveWeight.ts` | `services/ApiScaleService.ts` |
| Logo | `components/brand/logoPaths.ts` | `components/brand/logoPaths.ts` (mesmo arquivo) |
| Perfil (`/api/perfil/meus-dados`) | `lib/perfil/form.ts` | `services/ApiProfileService.ts` |

Mudou um desses formatos na API? Atualize os dois lados e os testes dos dois.

## Como criar...

**Uma tela nova**
1. Regras (cálculo, validação, formatação) em `lib/<assunto>/` com teste `.test.ts`.
2. Controller em `hooks/use<Tela>.ts`: estado, `api()` e o fluxo. A tela não chama `fetch`.
3. A tela em `app/<rota>/page.tsx`, montando componentes do kit. Componente que só serve a ela vai para
   `components/<área>/`, nunca declarado dentro do `page.tsx`.
4. Área protegida? Inclua o prefixo em `proxy.ts` (AREAS e matcher).

**Uma rota de API nova**: siga o padrão acima, teste em `route.test.ts`, documente no Swagger.

## Pensando no IoT (balança)

O módulo ESP32 manda as leituras para `POST /api/iot/leituras` (detalhes em `docs/IOT.md`). O servidor guarda o
último peso de cada balança e o histórico estável; o app e o site leem o mesmo `GET .../leitura`.
Próximos passos naturais, sem mudar as telas:

- **Registro da pesagem no servidor** (hoje só o app guarda, simulado): uma rota de pesagem por pedido/produto que
  use o peso estável da balança conectada, assinada pela sessão.
- **Tempo real sem perguntar a cada 0,5 s**: trocar o `useLiveWeight` por Server-Sent Events ou WebSocket; a tela
  continua recebendo o mesmo `LiveWeight`.
- **Vários módulos / outros sensores**: o `deviceId` já é genérico (MAC); um campo `tipo` na tabela `Balanca` e uma
  rota de leitura por tipo bastam.

## Verificação

```bash
npx tsc --noEmit && npx eslint src && npm test && npx next build
```
