# Raiz Conecta — App Principal

Site e API do Raiz Conecta: plataforma B2B que liga **produtores rurais** a **mercados** (hortifruti no atacado).
Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 (PostgreSQL) · Tailwind 4 · Cloudinary · JWT.

O app mobile do produtor (`app-mobile`) usa esta mesma API. A balança IoT (ESP32) também: ver [docs/IOT.md](docs/IOT.md).
Como o código está organizado (camadas, kit de componentes, visual, como criar uma tela ou rota nova): [ARQUITETURA.md](ARQUITETURA.md).

## Início rápido

```bash
npm install
cp .env.example .env.local      # preencha as variáveis (tabela abaixo)
npx prisma generate
npx prisma db push              # cria/atualiza as tabelas (inclui as das balanças)
npm run dev                     # http://localhost:3000
```

Primeiro administrador: abra `/api/setup-admin` uma vez (usa `ADMIN_SENHA_INICIAL`). Depois disso a rota não cria mais nada.

| Comando | O que faz |
|---|---|
| `npm test` | Testes (Vitest): rotas, regras de negócio, validações e a conferência da documentação da API |
| `npx tsc --noEmit` | Confere os tipos |
| `npm run lint` | ESLint |
| `npm run docs:api` | Regenera `src/swagger.json` a partir de `scripts/build-swagger.mjs` |

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | sim | PostgreSQL (Neon, Supabase...) |
| `JWT_SECRET` | **sim, em produção** (32+ caracteres) | Assina os tokens e gera os códigos de etiqueta das balanças. Sem ela, em produção o login e as rotas protegidas recusam funcionar (falha fechada) — configure também no ambiente **Preview** do Vercel |
| `ADMIN_SENHA_INICIAL` | para o setup | Senha do primeiro administrador (8+ caracteres, maiúscula, minúscula, número e símbolo) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | sim | Fotos de produtos, sugestões e documentos |
| `MICROSERVICE_URL` | não | Microsserviço de e-mails (`app-node`). Vazio = o site funciona sem enviar e-mails |
| `CORS_ALLOWED_ORIGIN` | não | Origem permitida para o app mobile na web. Vazio = qualquer origem |

> **Vercel:** o build deve ser só `next build`. Rode `npx prisma migrate deploy` (ou `db push`) fora do build, uma vez por mudança de banco. A migração `1_iot_balancas` cria as tabelas de balanças e histórico de pesagens.

## Sessão e segurança

- `POST /api/auth/login` confere a senha (bcrypt), cria um JWT HS256 de 2 h e o grava no **cookie httpOnly** `token` (o site) — a resposta também traz `token` para o app mobile mandar em `Authorization: Bearer`. O site **não guarda token no navegador**; quem está logado vem de `GET /api/auth/me`.
- O proxy (`src/proxy.ts`, o antigo middleware do Next) e cada rota conferem a assinatura do token e separam `/admin`, `/produtor` e `/catalogo` por perfil. As rotas usam sempre o e-mail **da sessão**; o `?email=` dos apps antigos só vale se for o mesmo.
- 5 senhas erradas em 15 min travam o login (por IP + e-mail). Trocar a senha em *Meu perfil* exige a **senha atual** (mesma trava). Os limites ficam em memória de cada instância: para um limite global use Redis/Upstash trocando só `lib/security/rateLimit.ts`.
- Respostas de erro são sempre `{ "error": "mensagem" }`; erros inesperados viram uma linha de log JSON (`event`, `message`, `code`) e um 500 sem detalhes.
- Recurso de outra pessoa responde 404 (não 403), para não revelar o que existe.
- O cadastro em duas etapas guarda o passo 1 (inclui a senha) **só na memória da página**; recarregar volta ao passo 1.

## Áreas do site

| Área | Rota | O que tem |
|---|---|---|
| Administração | `/admin` | Usuários (aprovar/rejeitar/suspender/editar), produtos, sugestões, administradores e **Balanças** (cadastrar MAC, ver código da etiqueta, gerar segredo, liberar) |
| Produtor | `/produtor` | Início, Catálogo, Ofertas, Entregas e Mais — as telas do app adaptadas ao computador (menu lateral, Início em colunas, Ofertas em tabela) — mais **Meu Perfil** (`/produtor/perfil`) e **Minha balança** (`/produtor/balancas`: adicionar pela etiqueta, renomear, trocar, remover e ver o **peso ao vivo**) |
| Mercado | `/catalogo`, `/checkout` | Catálogo com busca/filtros, cotação (carrinho guardado no navegador), confirmação, **Minhas cotações** (acompanhar ofertas, avaliar o produtor, cancelar em até 7 dias úteis) |
| Página inicial | `/` | Como funciona, para quem é, a balança conectada e os ODS; quem já entrou vai ao seu painel |
| Conta | `/perfil` (mercado), `/login`, `/completar-perfil`, `/cadastro-enviado` | Dados, endereço (CEP preenche sozinho), senha, exclusão de conta e a tela de "cadastro enviado" (olhe o e-mail) |

## API

Documentação completa e testável em **`/api-docs`** (Swagger). Para chamar rotas protegidas, cole o `token` do login no campo do topo.
A lista de rotas está em `scripts/build-swagger.mjs`; o teste `src/swagger.test.ts` falha se uma rota ficar sem documentação ou se a documentação citar uma rota que não existe.

## Balanças (IoT)

Resumo: o módulo ESP32 envia o peso para `POST /api/iot/leituras` (credencial própria, só o hash do segredo fica no banco); o app consulta `GET /api/produtor/balancas/{id}/leitura`. O produtor só vincula uma balança livre digitando o **código da etiqueta**. Detalhes, formatos e firmware de exemplo: [docs/IOT.md](docs/IOT.md).

## Estrutura

```
src/
  app/            páginas e rotas (app/api/**/route.ts)
  components/     ui/ (base), brand/, landing/, admin/, produtor/, mercado/, auth/, perfil/, balanca/, forms/, legal/
  hooks/          useSession, useCart, useScales, useLiveWeight, useProducerCatalog, useProfileForm...
  lib/            regras puras e testadas: auth, http (cliente da API), validation, format, mercado, produtor, iot, security, media
  proxy.ts        proteção de rotas e CORS (antigo middleware.ts)
prisma/           schema, migrações e seed
docs/             IOT.md e firmware de exemplo
scripts/          build-swagger.mjs
```

Regras de negócio ficam em `lib/` (funções puras com testes); as rotas só validam, chamam o Prisma e respondem; as telas só mostram.
