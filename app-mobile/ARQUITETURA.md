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

Espelha o site: passo 1 (`cadastro`) coleta tipo de perfil e dados da conta; passo 2 (`completar-perfil`) coleta documento, endereço (CEP via ViaCEP) e foto do comprovante; `em-analise` encerra o fluxo. Os dados ficam em memória no `RegistrationProvider` entre os passos e são enviados de uma vez como multipart para `POST /api/auth/cadastro`. Validações e máscaras são funções puras em `lib/validation` e `lib/format`.

### Regras do cadastro

- **Documento:** produtor usa CPF ou CNPJ; mercado, somente CNPJ (`lib/registration/rules.ts`). A foto enviada precisa combinar com o documento: CPF aceita RG ou CNH; CNPJ aceita Contrato Social ou Cartão CNPJ. Essas regras valem só no app; a API do site ainda não as exige.
- **Termos e Política de Privacidade:** mesmo texto do site, em `content/legalDocuments.ts`, exibidos em tela cheia por `LegalModal`. O aceite continua sendo a caixa de seleção.
- **Textos por perfil:** o rótulo, a dica e o exemplo do campo de nome mudam entre Produtor e Mercado (`content/registrationCopy.ts`, tabela por perfil).
- **Linguagem:** campos com exemplo (placeholder) e dica curta; texto a partir de 14 px e campos com 56 px de altura, pensando em quem tem pouca prática com celular.

## Animações (`components/motion`)

| Componente | O que faz |
|---|---|
| `BrandHeader` | Logo: a folha se desenha ao abrir, balança e gira ao toque. |
| `Reveal` + `staggerDelay` | Entrada suave dos blocos, um após o outro. |
| `PressableScale` | Botões, cartões e caixas afundam e voltam com mola ao toque. |
| `FloatingLeaves` | Folhinhas caindo ao fundo da tela "Conta em Análise". |
| `StepProgress` | A folhinha caminha pela barra até o passo atual. |

Todas respeitam "reduzir movimento" do aparelho (`useReducedMotion`). Usam a API `Animated` do React Native, sem biblioteca extra de animação.

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

## Comandos

```bash
npm install
cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL
npm test                 # Jest
npm run typecheck        # TypeScript
npx expo start
```
