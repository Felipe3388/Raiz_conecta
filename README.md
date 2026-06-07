<div align="center">

<br>

# 🌱 Raiz Conecta

### Plataforma B2B que conecta produtores rurais diretamente a mercados e hortifrutis, eliminando intermediários.

<br>

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)
![JWT](https://img.shields.io/badge/JWT-Auth-F7B93E?style=for-the-badge&logo=jsonwebtokens)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel)

</div>

---

## Curso Superior de Desenvolvimento de Software Multiplataforma — Fatec Votorantim

**Projeto Interdisciplinar** · Engenharia de Software II · Desenvolvimento Web III · Gestão Ágil de Projetos de Software

| Integrante | GitHub |
|---|---|
| Daniel Henrique Domingues Nogueira | — |
| Felipe Gomes Felix | — |
| Guilherme Vinícius Baeza de Oliveira | [@IneGuilherme](https://github.com/IneGuilherme) |
| Gustavo Henrique Bauch | — |
| Jhonatan Melo de Oliveira | — |

**Orientadores:** Profa. Cristiane Palomar Mercado · Prof. Tiago Vanderlei de Arruda · Prof. Jones Artur Gonçalves

**Votorantim — Junho, 2026**

---

## Resumo

O presente documento descreve o desenvolvimento do **Raiz Conecta**, uma plataforma digital B2B concebida para conectar produtores rurais diretamente a mercados e hortifrutis, eliminando intermediários e democratizando o acesso ao comércio justo de hortifruti. A solução abrange cadastro com validação manual, catálogo dinâmico, fluxo de demanda reversa, gestão de ofertas fracionadas, avaliação de entregas e microsserviço de notificação por e-mail, tudo construído com arquitetura fullstack moderna, autenticação JWT e deploy em nuvem.

---

## 🔗 Links do Projeto

| Recurso | Link |
|---|---|
| 🌐 **Aplicação em produção** | https://raiz-conecta-qa94.vercel.app |
| 📖 **API Docs (Swagger)** | https://raiz-conecta-qa94.vercel.app/api-docs |
| 📋 **Confluence** | https://raizconectado.atlassian.net/wiki/spaces/GGP |
| 🗂️ **Jira** | https://raizconectado.atlassian.net/jira/software/projects/SCRUM/boards/1 |
| 📦 **Repositório GitHub** | *(link do repositório do grupo)* |
| 📸 **Instagram** | [@raizconecta_dsm](https://www.instagram.com/raizconecta_dsm) |

---

## Sobre o Projeto

### Problema a ser solucionado

A cadeia de distribuição de alimentos frescos no Brasil apresenta ineficiências estruturais que prejudicam ambas as pontas do comércio:

- **Produtores rurais** dependem de intermediários que reduzem drasticamente sua margem de lucro
- **Mercados locais** arcam com custos elevados de aquisição por não ter acesso direto a fornecedores confiáveis
- **Desperdício de alimentos** causado pela ineficiência logística na cadeia de distribuição

### Público-alvo

A plataforma destina-se a dois grupos primários: estabelecimentos comerciais de pequeno e médio porte (mercados, hortifrutis) e produtores rurais que buscam escoar sua produção com maior autonomia e retorno financeiro.

### Solução Proposta

O **Raiz Conecta** atua como ponte digital entre quem planta e quem vende ao consumidor final, utilizando um fluxo de **demanda reversa**: o mercado publica o que precisa e os produtores ofertam diretamente, sem intermediários.

### Diferenciais

- Esteira de aprovação manual pelo Admin — segurança contra cadastros fraudulentos
- Fluxo de demanda reversa — mercado publica, produtor responde com oferta
- Microsserviço de e-mail independente — desempenho sem bloqueio do fluxo principal
- Design system próprio com classes `.rc-*` sobre Tailwind CSS v4
- Documentação de API pública via Swagger com autenticação JWT sob demanda

### Justificativa

O desenvolvimento do Raiz Conecta justifica-se pela necessidade de modernizar e desburocratizar a relação comercial entre produtores rurais e estabelecimentos varejistas, promovendo inclusão digital no agronegócio, redução de desperdício alimentar e geração de renda justa — em alinhamento com os **Objetivos de Desenvolvimento Sustentável (ODS)** da ONU.

---

## Funcionalidades

### Tela Inicial — Landing Page

- Apresentação da plataforma com proposta de valor e fluxo de 3 passos animado
- Redirecionamento dinâmico: usuário logado vai direto ao seu painel
- Link para [@raizconecta_dsm](https://www.instagram.com/raizconecta_dsm) no hero e no footer

### Criar Conta — Cadastro em 2 Passos

**Passo 1 — Dados de acesso:**

O usuário seleciona seu perfil de forma visual (botões 🌱 Produtor Rural / 🏪 Mercado), informa nome, e-mail, telefone com máscara automática e cria uma senha. O sistema valida o e-mail por regex em tempo real e exibe um **indicador de força de senha com 5 níveis** (Muito fraca → Muito forte), exigindo no mínimo 8 caracteres com maiúscula, minúscula, número e símbolo especial. A senha é confirmada em um segundo campo com feedback visual instantâneo.

**Passo 2 — Onboarding:**

Preenchimento de CPF ou CNPJ com máscara automática, endereço com autocompletar via API ViaCEP e upload do documento de identificação para validação manual pelo Administrador. Um badge no topo confirma o tipo de perfil selecionado no Passo 1.

A conta é criada com status `EM_ANALISE` e aguarda aprovação do Admin.

### Entrar — Login

- Autenticação com e-mail e senha via hash bcrypt
- Geração de token JWT com expiração de 24 horas
- Redirecionamento automático para o painel correto (Admin / Produtor / Mercado)

### Tela do Mercado — Catálogo e Cotações

Ao acessar o painel, o mercado visualiza a vitrine de produtos com:

- **Filtros avançados:** busca por nome, filtro por categoria (Frutas, Verduras, Legumes, Grãos) e ordenação por preço crescente, decrescente ou ordem alfabética
- **Stepper de quantidade** `+ / −` em cada produto
- **Carrinho lateral** persistente via `localStorage`
- **Acompanhamento de cotações** com barra de progresso de preenchimento e lista de produtores que ofertaram
- **Cancelamento de pedido** dentro do prazo de **7 dias úteis** (cálculo real, excluindo fins de semana)
- **Avaliação do produtor** com nota de 1 a 5 estrelas após confirmar o recebimento

**Check-out:**

Exibe todos os itens selecionados com nome, quantidade e preço estimado. Os dados de entrega são preenchidos automaticamente com as informações do perfil. Ao confirmar, são criadas demandas `ABERTAS` no banco para cada item do carrinho.

### Tela do Produtor — Mural e Catálogo

Ao acessar o painel, o produtor encontra três abas:

- **Mural de Oportunidades:** lista as demandas abertas compatíveis com os produtos que o produtor selecionou em seu catálogo, com barra de progresso de preenchimento da carga e campo numérico para registrar oferta parcial ou total
- **Meu Catálogo:** grid de todos os produtos do catálogo oficial para seleção dos que produz, com campo de busca e contador de itens selecionados
- **Ofertas Fechadas:** histórico de todas as demandas onde o produtor já se comprometeu

O produtor também pode sugerir novos produtos ao catálogo oficial via formulário com nome, preço sugerido, descrição e foto.

### Meus Dados — Perfil

- Edição de nome, telefone e endereço
- E-mail e documento bloqueados para edição (segurança e conformidade LGPD)
- Alteração de senha
- Exclusão de conta com dupla confirmação

### Painel Administrativo

**Dashboard:** estatísticas em tempo real — total de usuários, produtores ativos, mercados ativos e produtos no catálogo.

**Aprovações Pendentes:** lista de cadastros aguardando validação, com visualização do documento enviado, aprovação ou rejeição com disparo automático de e-mail de notificação.

**Gestão de Usuários:** busca por nome ou e-mail, filtros por tipo (Produtor/Mercado/Admin) e por status (Aprovado/Suspenso/Rejeitado), visualização de CPF/CNPJ, ações de suspender, reativar ou excluir contas permanentemente.

**Catálogo Oficial:** cadastro de produtos com foto, edição completa incluindo troca de imagem (upload no Cloudinary com remoção automática da foto anterior), e remoção de produtos.

**Sugestões:** revisão, edição e promoção de sugestões dos produtores ao catálogo oficial, ou descarte com um clique.

---

## Descrição do Projeto

### Proposta do Software

O Raiz Conecta consiste em uma plataforma digital de natureza B2B desenvolvida com o objetivo de modernizar a relação comercial entre produtores rurais e estabelecimentos varejistas. Em sua versão atual (MVP), a plataforma está delimitada ao escopo de pequenos e médios produtores e mercados, sem contemplar módulo de entregadores e pagamento integrado, previstos para versões futuras.

### Objetivos de Desenvolvimento Sustentável (ODS)

O projeto contribui diretamente para os ODS da ONU, especialmente:
- **ODS 2** — Fome zero e agricultura sustentável
- **ODS 8** — Trabalho decente e crescimento econômico
- **ODS 12** — Consumo e produção responsáveis

---

## Requisitos do Projeto

### Requisitos Atendidos — Disciplina Desenvolvimento Web III

| # | Requisito | Status | Evidência |
|---|-----------|--------|-----------|
| 1 | Hospedagem GitHub com README e nome dos integrantes | ✅ | Este arquivo |
| 2 | API RESTful completa com GET, POST, PUT e DELETE | ✅ | `src/app/api/**` — 26 endpoints |
| 3 | Arquitetura MVC | ✅ | Prisma (Model) + `page.tsx` (View) + `route.ts` (Controller) |
| 4 | Microsserviço obrigatório | ✅ | `/microservico` — Express.js + Nodemailer |
| 5 | Aplicação hospedada em nuvem | ✅ | Vercel + Neon (PostgreSQL serverless) |
| 6 | API documentada (Swagger/Postman) | ✅ | Swagger UI em `/api-docs` |
| 7 | Sistema de login com autenticação | ✅ | JWT + bcryptjs, cadastro em 2 passos com aprovação admin |
| 8 | Proteção de rotas com token | ✅ | `src/middleware.ts` — intercepta 5 grupos de rotas |
| 9 | SPA com framework moderno | ✅ | React 19 + Next.js 16 App Router |

---

## Projeto do Software

### Tecnologias Utilizadas

**Front-end**

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Next.js | 16.2 | Framework fullstack — SSR, App Router, Route Handlers |
| React | 19.2 | Biblioteca de componentes de interface |
| TypeScript | 5 | Tipagem estática — reduz erros em runtime |
| Tailwind CSS | v4 | Utilitários CSS + design system `.rc-*` próprio |
| Framer Motion | 12 | Animações de transição em tabs e modais |
| Lucide React | — | Ícones SVG consistentes |
| Sonner | — | Toasts de feedback ao usuário |

**Back-end**

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js + Express | 5 | Microsserviço de e-mail independente |
| Prisma ORM | 6 | Mapeamento objeto-relacional e migrations |
| PostgreSQL (Neon) | serverless | Banco relacional em nuvem |
| jsonwebtoken | 9 | Geração e verificação de tokens JWT |
| bcryptjs | 3 | Hash de senhas com salt — nunca texto puro |
| Cloudinary | 2 | Upload e armazenamento de fotos e documentos |
| Nodemailer + Mailtrap | — | Envio de e-mails transacionais |
| Swagger UI React | — | Documentação interativa de API em `/api-docs` |

### Arquitetura

O projeto é um **monorepo** com dois serviços independentes:

```
raiz-conecta/
├── app-principal/     # Next.js 16 — Frontend + API RESTful
└── microservico/      # Node.js + Express — Microsserviço de e-mail
```

**Fluxo Principal (Web):**

```
Navegador (React/Next.js)
  → Route Handlers Next.js (/api/*)    ← Controller
    → Prisma ORM                        ← Model
      → PostgreSQL (Neon serverless)
```

**Fluxo de Notificações (Microsserviço):**

```
Evento (cadastro / aprovação / rejeição)
  → app-principal chama MICROSERVICE_URL
    → Express.js recebe a requisição
      → Nodemailer envia e-mail via Mailtrap
```

### Padrão MVC no Next.js App Router

| Camada | Implementação | Localização |
|---|---|---|
| **Model** | Schema Prisma + queries nos Route Handlers | `prisma/schema.prisma` |
| **View** | Componentes React — SSR + CSR | `src/app/*/page.tsx` |
| **Controller** | Route Handlers REST (GET/POST/PUT/DELETE) | `src/app/api/*/route.ts` |

### Autenticação JWT

1. **Login** → API valida senha com bcrypt → gera JWT com `{ email, tipoUser, nome }` → token salvo no `localStorage`
2. **Requisições** → frontend envia `Authorization: Bearer <token>` em rotas protegidas
3. **Middleware** → `src/middleware.ts` intercepta e valida o JWT antes de servir as páginas
4. **Expiração** → token expira em 24 horas; após isso o usuário precisa logar novamente
5. **Segredo** → `JWT_SECRET` fica exclusivamente no arquivo `.env` — nunca no código-fonte

**Rotas protegidas pelo middleware:**

| Rota | Perfil exigido |
|---|---|
| `/admin/*` | `tipoUser === 'admin'` |
| `/produtor/*` | `tipoUser === 'produtor'` |
| `/catalogo/*` e `/mercado/*` | `tipoUser === 'mercado'` |
| `/perfil/*` e `/checkout/*` | Qualquer usuário autenticado |
| `/api-docs` | Pública — token opcional (endpoints admin exigem JWT) |

### API RESTful — Endpoints

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/auth/cadastro` | Criar usuário (Produtor ou Mercado) | Pública |
| `POST` | `/api/auth/login` | Autenticar e retornar JWT | Pública |
| `GET` | `/api/produtos` | Listar catálogo oficial | Pública |
| `POST` | `/api/produtos` | Admin: criar produto com foto | Admin JWT |
| `PUT` | `/api/produtos` | Admin: editar produto + troca de foto | Admin JWT |
| `DELETE` | `/api/produtos` | Admin: remover produto do catálogo | Admin JWT |
| `GET` | `/api/admin/usuarios` | Listar todos os usuários | Admin JWT |
| `PUT` | `/api/admin/usuarios` | Aprovar / rejeitar / suspender usuário | Admin JWT |
| `PATCH` | `/api/admin/usuarios` | Editar dados de usuário | Admin JWT |
| `DELETE` | `/api/admin/usuarios` | Excluir usuário permanentemente | Admin JWT |
| `POST` | `/api/admin/novo-admin` | Criar nova conta de administrador | Admin JWT |
| `POST` | `/api/admin/promover-sugestao` | Promover sugestão a produto oficial | Admin JWT |
| `GET` | `/api/mercado/demandas` | Listar demandas abertas | Autenticado |
| `POST` | `/api/mercado/demandas` | Criar demanda — checkout | Mercado JWT |
| `PATCH` | `/api/mercado/cancelar` | Cancelar pedido (até 7 dias úteis) | Mercado JWT |
| `PATCH` | `/api/mercado/avaliar` | Avaliar entrega do produtor | Mercado JWT |
| `GET` | `/api/mercado/perfil` | Dados do mercado logado | Mercado JWT |
| `GET` | `/api/produtor/meus-produtos` | Catálogo selecionado pelo produtor | Produtor JWT |
| `POST` | `/api/produtor/meus-produtos` | Salvar catálogo do produtor | Produtor JWT |
| `POST` | `/api/produtor/ofertas` | Enviar oferta para demanda aberta | Produtor JWT |
| `GET` | `/api/produtor/sugestao` | Listar sugestões de produto | Admin JWT |
| `POST` | `/api/produtor/sugestao` | Enviar sugestão de novo produto | Produtor JWT |
| `DELETE` | `/api/produtor/sugestao` | Descartar sugestão | Admin JWT |
| `GET` | `/api/vendedor/perfil` | Dados do produtor logado | Produtor JWT |
| `GET` | `/api/perfil/meus-dados` | Dados do usuário logado | Autenticado |
| `PATCH` | `/api/perfil/completar` | Atualizar dados do perfil | Autenticado |

### Banco de Dados — Modelos Prisma

| Modelo | Tabela | Descrição |
|---|---|---|
| `Cliente` | `cliente` | Mercados e hortifrutis cadastrados |
| `Vendedor` | `vendedor` | Produtores rurais cadastrados |
| `Acesso` | `acesso` | Credenciais de login (hash bcrypt + tipoUser) |
| `Produto` | `produtos` | Catálogo oficial — nome, tipo, preço, foto (Cloudinary) |
| `Demanda` | `demanda` | Cotações abertas pelo mercado no checkout |
| `Oferta` | `oferta` | Respostas dos produtores às demandas |
| `Sugestao` | `sugestoes` | Sugestões de novos produtos enviadas por produtores |
| `Pedido` | `pedidos` | Pedidos consolidados (estrutura para evolução futura) |
| `Entregador` | `entregador` | Estrutura preparada para módulo futuro de logística |
| `Rota` | `rota` | Rotas de entrega (módulo futuro) |

### Estrutura de Pastas

```
app-principal/
├── prisma/
│   └── schema.prisma              # Modelos do banco de dados
├── src/
│   ├── app/
│   │   ├── api/                   # Route Handlers (Controller)
│   │   │   ├── auth/              # cadastro, login
│   │   │   ├── admin/             # usuarios, produtos, sugestoes
│   │   │   ├── mercado/           # demandas, cancelar, avaliar
│   │   │   ├── produtor/          # ofertas, meus-produtos, sugestao
│   │   │   ├── perfil/            # meus-dados, completar
│   │   │   └── produtos/          # catálogo público
│   │   ├── admin/                 # Painel administrativo (View)
│   │   ├── catalogo/              # Painel do mercado (View)
│   │   ├── produtor/              # Painel do produtor (View)
│   │   ├── perfil/                # Edição de perfil (View)
│   │   ├── login/                 # Autenticação (View)
│   │   ├── completar-perfil/      # Onboarding passo 2 (View)
│   │   ├── api-docs/              # Swagger UI
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Layout global
│   │   └── globals.css            # Design system (.rc-*)
│   ├── components/
│   │   ├── ui/                    # Componentes reutilizáveis
│   │   │   ├── Button.tsx         # Botão com variantes e loading
│   │   │   ├── Card.tsx           # Card com variante flat/hover
│   │   │   ├── Input.tsx          # Input com ícone, hint e error
│   │   │   ├── Badge.tsx          # Badge com variantes de cor
│   │   │   ├── Modal.tsx          # Modal genérico
│   │   │   ├── ConfirmModal.tsx   # Modal de confirmação
│   │   │   ├── StatCard.tsx       # Card de estatística
│   │   │   ├── TabNav.tsx         # Navegação por abas
│   │   │   ├── SearchBar.tsx      # Barra de busca com clear
│   │   │   ├── EmptyState.tsx     # Estado vazio com ação
│   │   │   ├── QuantityInput.tsx  # Stepper de quantidade
│   │   │   ├── ProgressBar.tsx    # Barra de progresso
│   │   │   ├── Select.tsx         # Select padronizado
│   │   │   ├── InfoRow.tsx        # Linha label/valor
│   │   │   ├── PageLoader.tsx     # Tela de carregamento
│   │   │   └── StatusBanner.tsx   # Banner de status da conta
│   │   ├── layout/                # SiteHeader, SiteFooter
│   │   └── shared/                # PageLoader, StatusBanner
│   ├── lib/
│   │   └── prisma.ts              # Instância singleton do Prisma
│   ├── middleware.ts               # Proteção JWT de rotas
│   └── swagger.json               # Especificação OpenAPI
└── public/                        # Assets estáticos
```

---

## Gestão Ágil — Sprints

| Sprint | Objetivo | Início | Fim |
|---|---|---|---|
| **Sprint 1** | Autenticação, cadastro, painel admin, catálogo, carrinho, checkout, painel produtor, landing page, avaliações, microsserviço de e-mail | 08/04/2026 | 29/04/2026 |
| **Sprint 2** | Melhorias pós-banca: componentização, design system `.rc-*`, filtros avançados, validação regex, cancelamento de pedido, API docs JWT, correções SCRUM-144 a 147 | 29/04/2026 | 20/06/2026 |

**Total:** 14+ histórias entregues · 49+ story points · 2 sprints · 0 bugs críticos em produção

### Principais entregas da Sprint 2

| SCRUM | Descrição |
|---|---|
| **SCRUM-144** | Correção do bug `"Aprovações Pendentes0"` — número zero colado no título da aba |
| **SCRUM-145** | Campo de busca na aba de produtos do produtor e do mercado |
| **SCRUM-146** | Campo de confirmação de senha com feedback visual em tempo real |
| **SCRUM-147** | Correção do alinhamento dos botões no banner Meu Catálogo |
| **Design System** | 20+ classes `.rc-*` no `globals.css` — componentes padronizados |
| **Filtros avançados** | Catálogo com busca + categoria + ordenação por preço |
| **Segurança** | Indicador de força de senha, regex de e-mail, validação de tipoUsuario na API |
| **Admin** | Troca de foto de produto, coluna de documento, filtros por tipo e status |
| **Cancelamento** | API com cálculo real de 7 dias úteis (segunda a sexta) |
| **Instagram** | Link `@raizconecta_dsm` no footer e na landing page |

### Resultados Alcançados

- Funcionamento completo da conexão entre produtores e mercados via fluxo de demanda reversa
- Sistema de autenticação seguro com JWT e bcrypt, aprovação manual de cadastros e notificações por e-mail
- Catálogo dinâmico integrado ao PostgreSQL (Neon.tech) com filtros por categoria e busca em tempo real
- Microsserviço de e-mail desacoplado com templates HTML para boas-vindas, aprovação, rejeição e sugestão
- Gestão ágil com Scrum: 2 sprints concluídas, 14+ histórias entregues, 49+ story points e 0 bugs críticos em produção

---

## Como Executar o Projeto

### Pré-requisitos

- Node.js 18 ou superior
- npm
- Conta no [Neon](https://neon.tech) — PostgreSQL serverless gratuito
- Conta no [Cloudinary](https://cloudinary.com) — upload de imagens gratuito
- Conta no [Mailtrap](https://mailtrap.io) — sandbox de e-mails para testes

### Passo 1 — Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd raiz-conecta
```

### Passo 2 — Rodar a Aplicação Principal (Next.js)

```bash
cd app-principal
npm install
```

Crie o arquivo `.env` na raiz de `app-principal/`:

```env
DATABASE_URL="postgresql://usuario:senha@host/banco"
JWT_SECRET="sua_chave_secreta_minimo_32_caracteres"
CLOUDINARY_CLOUD_NAME="seu_cloud_name"
CLOUDINARY_API_KEY="sua_api_key"
CLOUDINARY_API_SECRET="seu_api_secret"
MICROSERVICE_URL="http://localhost:3001"
ADMIN_SENHA_INICIAL="senha_do_primeiro_admin"
```

```bash
npx prisma generate
npx prisma db push        # cria as tabelas no banco
npm run dev               # http://localhost:3000

npx prisma studio         # interface visual do banco — http://localhost:5555
```

### Passo 3 — Rodar o Microsserviço de E-mail (Express.js)

```bash
cd microservico
npm install
node server.js            # http://localhost:3001
```

Crie o arquivo `.env` em `microservico/`:

```env
MAILTRAP_USER="seu_usuario_mailtrap"
MAILTRAP_PASS="sua_senha_mailtrap"
PORT=3001
```

### Passo 4 — Criar o primeiro Admin

Após iniciar o app-principal, acesse **uma única vez**:

```
http://localhost:3000/api/setup-admin
```

> ⚠️ Esse endpoint usa `ADMIN_SENHA_INICIAL` do `.env`. Remova ou proteja após o primeiro uso.

---

## Deploy em Produção — Vercel

Configure as variáveis em **Vercel → Settings → Environment Variables**:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL (Neon) |
| `JWT_SECRET` | Chave secreta JWT (mín. 32 caracteres) |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API Key Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary |
| `MICROSERVICE_URL` | URL do microsserviço hospedado (Railway, Render) |
| `ADMIN_SENHA_INICIAL` | Senha para criação do primeiro admin |

**Comando de build:**

```bash
npx prisma generate && next build
```

---

## Limitações e Evolução Futura

| Limitação atual | Evolução planejada |
|---|---|
| Entregador existe no banco mas sem painel de interface | Módulo completo de logística com rastreamento de rotas |
| JWT sem blacklist server-side | Redis para token revocation em tempo real |
| Sem notificação em tempo real | WebSockets ou SSE para alertas de novas demandas |
| Sem pagamento integrado | Gateway de pagamento (Stripe, PagSeguro) |
| E-mail via Mailtrap (sandbox) | SendGrid ou Amazon SES em produção |

---

## Documentação do Projeto (Confluence e Jira)

A gestão documental e o acompanhamento do progresso foram conduzidos nas plataformas Atlassian:

- **Confluence — Wiki e Documentação:** https://raizconectado.atlassian.net/wiki/spaces/GGP
- **Jira — Board Scrum:** https://raizconectado.atlassian.net/jira/software/projects/SCRUM/boards/1

**Sprint PI (Sprint 1):** 11 histórias de usuário · 45 story points  
**Sprint PI 2 (Sprint 2):** melhorias pós-banca · foco em qualidade, segurança e UX  
**Total geral:** 14+ histórias · 49+ story points

---

## Referências

- SOMMERVILLE, Ian. *Engenharia de Software*. 8ª ed. Pearson, 2007.
- SOMERVILLE, I. *Engenharia de software*. 10. ed. São Paulo: Pearson, 2016.
- PRESSMAN, R. S.; MAXIM, B. *Engenharia de software: uma abordagem profissional*. 9. ed. Porto Alegre: McGraw-Hill Education, 2021.
- DATE, C. J. *Introdução a sistemas de banco de dados*. 8. ed. Rio de Janeiro: Campus, 2004.
- FREEMAN, A. *Pro React 18*. New York: Apress, 2022.
- FLANAGAN, D. *JavaScript: o guia definitivo*. 8. ed. O'Reilly Media, 2024.
- GARRETT, J. J. *Os elementos da experiência do usuário*. 2. ed. São Paulo: Voices That Matter, 2011.

---

<div align="center">

🌱 **Raiz Conecta** · Fatec Votorantim · DSM · Projeto Integrador 2026

</div>
