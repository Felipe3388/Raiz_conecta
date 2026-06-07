<div align="center">

# 🌱 Raiz Conecta

**Plataforma B2B que conecta produtores rurais diretamente a mercados e hortifrutis, eliminando intermediários.**

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![JWT](https://img.shields.io/badge/JWT-Auth-F7B93E?logo=jsonwebtokens)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)

</div>

---

## 👥 Integrantes — Fatec Votorantim · DSM

| Nome | GitHub |
|------|--------|
| Guilherme Vinícius Baeza de Oliveira | [@IneGuilherme](https://github.com/IneGuilherme) |
| Felipe Gomes Félix | — |
| Jhonatan Melo | — |
| Gustavo Henrique Bauch | — |
| Daniel Henrique Nogueira | — |

---

## 🔗 Links do Projeto

| Recurso | Link |
|---------|------|
| 📋 Confluence (documentação) | https://raizconectado.atlassian.net/wiki/x/AYBF |
| 🗂️ Jira (gestão ágil / roadmap) | https://raizconectado.atlassian.net/jira/software/projects/SCRUM/boards/1 |
| 🌐 Aplicação em produção | *(link Vercel do grupo)* |
| 📖 API Docs (Swagger) | `<URL_PRODUCAO>/api-docs` |

---

## 🧩 Sobre o Projeto

O **Raiz Conecta** resolve um problema real na cadeia de distribuição de alimentos: produtores rurais dependem de intermediários para escoar produção, enquanto mercados locais arcam com custos elevados de aquisição. A plataforma cria um canal direto entre quem planta e quem vende ao consumidor final.

### Problema de Negócio
- Produtores têm margem reduzida por intermediários
- Mercados pagam mais por não ter acesso direto a fornecedores
- Desperdício de alimentos por ineficiência logística

### Solução
Plataforma **B2B fullstack** com fluxo de **demanda reversa**: o mercado publica o que precisa e os produtores ofertam sua produção diretamente.

---

## 🏗️ Arquitetura

O projeto é um **monorepo** com dois serviços independentes:

```
raiz-conecta/
├── app-principal/     # Next.js 16 — Frontend + API RESTful
└── microservico/      # Node.js + Express — Microsserviço de e-mail
```

### Fluxo Principal (Web)
```
Navegador (React/Next.js)
    → Route Handlers Next.js (/api/*)
        → Prisma ORM
            → PostgreSQL (Neon Serverless)
```

### Fluxo de Notificações (Microsserviço)
```
Evento (cadastro / aprovação / rejeição)
    → app-principal chama MICROSERVICE_URL
        → Express.js (app-node)
            → Nodemailer + Mailtrap
                → E-mail entregue
```

### Padrão MVC no Next.js App Router
| Camada | Onde está |
|--------|-----------|
| **Model** | `prisma/schema.prisma` + queries Prisma nos route handlers |
| **View** | `src/app/*/page.tsx` — componentes React (SSR + CSR) |
| **Controller** | `src/app/api/*/route.ts` — Route Handlers REST |

---

## ✅ Requisitos Atendidos

| Requisito | Status | Onde |
|-----------|--------|------|
| Hospedagem GitHub com README | ✅ | Este repositório |
| API RESTful com GET, POST, PUT, DELETE | ✅ | `src/app/api/**` |
| Arquitetura MVC | ✅ | Prisma + Route Handlers + Pages |
| Microsserviço | ✅ | `/microservico` (Express + Nodemailer) |
| Hospedagem em nuvem | ✅ | Vercel (app) + Neon (DB) |
| Documentação de API | ✅ | Swagger em `/api-docs` |
| Sistema de login com autenticação | ✅ | JWT + bcryptjs |
| Proteção de rotas com token | ✅ | `src/middleware.ts` |
| SPA com framework moderno | ✅ | React 19 + Next.js 16 |

---

## 🔐 Segurança e Autenticação JWT

O sistema usa **JSON Web Tokens (JWT)** para autenticação stateless:

1. **Login** → API valida e-mail/senha (bcryptjs) → gera JWT com payload `{ email, tipoUser, nome }` → token salvo no `localStorage`
2. **Requisições** → frontend envia `Authorization: Bearer <token>` em rotas protegidas
3. **Middleware** → `src/middleware.ts` intercepta e valida o JWT antes de servir `/admin`, `/produtor`, `/mercado`, `/perfil` e `/checkout`
4. **Expiração** → token expira em 24 horas

```
Senhas: bcryptjs (salt rounds 10) — nunca salvas em texto puro
JWT_SECRET: variável de ambiente (.env) — nunca no código-fonte
Documentos e fotos: Cloudinary via stream — nunca no servidor
HTTPS: obrigatório em produção (Vercel)
```

---

## 🚀 Funcionalidades Implementadas

### 🌐 Landing Page
- Apresentação da plataforma com fluxo de 3 passos
- Redirecionamento dinâmico para o painel do usuário logado
- Link para Instagram [@raizconecta_dsm](https://www.instagram.com/raizconecta_dsm)

### 🔑 Autenticação
- Cadastro em 2 passos com seleção de perfil (Produtor / Mercado)
- Validação de e-mail e senha forte por regex (mínimo 8 chars, maiúscula, minúscula, número e símbolo)
- Indicador de força de senha em tempo real
- Campo de telefone com máscara automática
- Confirmação de senha com feedback visual
- Login com JWT + redirecionamento por perfil

### 🛡️ Painel Administrativo
- Aprovação / rejeição de cadastros com visualização de documento
- Gestão de usuários com filtros por tipo, status e busca
- Catálogo oficial: cadastro, edição (com troca de foto) e remoção de produtos
- Avaliação e promoção de sugestões de produtores a produtos oficiais
- Criação de novas contas de administrador
- Dashboard com estatísticas em tempo real

### 🌱 Painel do Produtor
- Mural de Oportunidades — demandas abertas compatíveis com o catálogo do produtor
- Meu Catálogo — seleção dos produtos que produz (com busca e filtro)
- Envio de oferta parcial ou total com controle de quantidade
- Sugestão de novos produtos ao catálogo oficial
- Histórico de Ofertas Fechadas

### 🏪 Painel do Mercado (Catálogo)
- Vitrine com busca por nome, filtro por categoria e ordenação por preço
- Carrinho lateral persistente (localStorage)
- Checkout com endereço preenchido automaticamente
- Acompanhamento de cotações com barra de progresso
- Cancelamento de pedido com prazo de 7 dias úteis e cálculo de dias úteis real
- Avaliação do produtor após entrega (1–5 estrelas)

### 👤 Perfil
- Edição de dados pessoais (nome, telefone, endereço, senha)
- E-mail e documento bloqueados para edição
- Exclusão de conta com dupla confirmação (LGPD)

### 📖 API Docs
- Swagger UI público em `/api-docs`
- Endpoints admin protegidos por token JWT inserido manualmente na interface
- `swagger.json` com securitySchemes BearerAuth

---

## 📡 API RESTful — Endpoints

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/cadastro` | Criar usuário | Pública |
| POST | `/api/auth/login` | Login → retorna JWT | Pública |
| GET | `/api/produtos` | Listar catálogo | Pública |
| POST | `/api/produtos` | Admin: criar produto | Admin JWT |
| PUT | `/api/produtos` | Admin: editar produto + foto | Admin JWT |
| DELETE | `/api/produtos` | Admin: remover produto | Admin JWT |
| GET | `/api/admin/usuarios` | Listar usuários | Admin JWT |
| PUT | `/api/admin/usuarios` | Aprovar/rejeitar/suspender | Admin JWT |
| PATCH | `/api/admin/usuarios` | Editar dados de usuário | Admin JWT |
| DELETE | `/api/admin/usuarios` | Excluir usuário | Admin JWT |
| POST | `/api/admin/novo-admin` | Criar administrador | Admin JWT |
| POST | `/api/admin/promover-sugestao` | Promover sugestão a produto | Admin JWT |
| GET | `/api/mercado/demandas` | Listar demandas abertas | Autenticado |
| POST | `/api/mercado/demandas` | Criar demanda (checkout) | Mercado JWT |
| PATCH | `/api/mercado/cancelar` | Cancelar pedido | Mercado JWT |
| PATCH | `/api/mercado/avaliar` | Avaliar entrega | Mercado JWT |
| GET | `/api/mercado/perfil` | Dados do mercado logado | Mercado JWT |
| GET | `/api/produtor/meus-produtos` | Catálogo do produtor | Produtor JWT |
| POST | `/api/produtor/meus-produtos` | Salvar catálogo | Produtor JWT |
| POST | `/api/produtor/ofertas` | Enviar oferta | Produtor JWT |
| GET | `/api/produtor/sugestao` | Listar sugestões | Admin JWT |
| POST | `/api/produtor/sugestao` | Enviar sugestão | Produtor JWT |
| DELETE | `/api/produtor/sugestao` | Descartar sugestão | Admin JWT |
| GET | `/api/vendedor/perfil` | Dados do produtor logado | Produtor JWT |
| GET | `/api/perfil/meus-dados` | Dados do usuário logado | Autenticado |
| PATCH | `/api/perfil/completar` | Atualizar perfil | Autenticado |

---

## 🗄️ Banco de Dados — Modelos Prisma

| Modelo | Descrição |
|--------|-----------|
| `Cliente` | Mercados cadastrados |
| `Vendedor` | Produtores rurais cadastrados |
| `Acesso` | Credenciais de login (hash bcrypt + JWT info) |
| `Produto` | Catálogo oficial de produtos com foto (Cloudinary) |
| `Demanda` | Cotações criadas pelo mercado no checkout |
| `Oferta` | Respostas dos produtores a uma demanda |
| `Sugestao` | Sugestões de novos produtos enviadas por produtores |
| `Pedido` | Pedidos consolidados |
| `ItemPedido` | Itens individuais de um pedido |
| `Entregador` | Estrutura para entregadores (v. futura) |
| `Rota` | Rotas de entrega (v. futura) |

---

## 🧱 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React | 19.2 |
| Framework | Next.js | 16.2 |
| Linguagem | TypeScript | 5 |
| Estilização | Tailwind CSS | v4 |
| Ícones | Lucide React | — |
| Animações | Framer Motion | 12 |
| ORM | Prisma | 6 |
| Banco | PostgreSQL (Neon) | serverless |
| Autenticação | jsonwebtoken + bcryptjs | 9 / 3 |
| Upload | Cloudinary | 2 |
| Notificações UI | Sonner | — |
| Microsserviço | Node.js + Express | 5 |
| E-mail | Nodemailer + Mailtrap | — |
| API Docs | Swagger UI React | — |
| Analytics | Microsoft Clarity | — |
| Deploy | Vercel + Neon | — |

---

## ⚙️ Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- npm
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito) ou SQLite para dev
- Conta no [Cloudinary](https://cloudinary.com) (gratuito)
- Conta no [Mailtrap](https://mailtrap.io) (para e-mails de teste)

### Passo 1 — Clonar o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd raiz-conecta
```

### Passo 2 — Configurar o app-principal
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
npx prisma db push        # cria as tabelas
npm run dev               # http://localhost:3000
```

### Passo 3 — Configurar o microsserviço
```bash
cd ../microservico
npm install
```

Crie o arquivo `.env` em `microservico/`:
```env
MAILTRAP_USER="seu_usuario_mailtrap"
MAILTRAP_PASS="sua_senha_mailtrap"
PORT=3001
```

```bash
node server.js            # http://localhost:3001
```

### Passo 4 — Criar o primeiro Admin
Após rodar o app-principal, acesse uma vez:
```
http://localhost:3000/api/setup-admin
```
> ⚠️ Esse endpoint usa `ADMIN_SENHA_INICIAL` do `.env`. Remova ou proteja após o primeiro uso.

### Passo 5 — Explorar
```bash
npx prisma studio         # Interface visual do banco — http://localhost:5555
```

---

## ☁️ Deploy em Produção (Vercel)

### Variáveis de ambiente obrigatórias no Vercel
| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL (Neon) |
| `JWT_SECRET` | Chave secreta JWT (mín. 32 caracteres) |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API Key Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary |
| `MICROSERVICE_URL` | URL do microsserviço (Railway, Render etc.) |
| `ADMIN_SENHA_INICIAL` | Senha para criar o primeiro admin |

### Comando de build
```bash
npx prisma generate && next build
```

---

## 📁 Estrutura de Pastas

```
app-principal/
├── prisma/
│   └── schema.prisma          # Modelos do banco de dados
├── src/
│   ├── app/
│   │   ├── api/               # Route Handlers (Controller)
│   │   │   ├── auth/          # cadastro, login
│   │   │   ├── admin/         # usuarios, produtos, sugestoes
│   │   │   ├── mercado/       # demandas, cancelar, avaliar
│   │   │   ├── produtor/      # ofertas, meus-produtos, sugestao
│   │   │   ├── perfil/        # meus-dados, completar
│   │   │   └── produtos/      # catálogo público
│   │   ├── admin/             # Painel administrativo (View)
│   │   ├── catalogo/          # Painel do mercado (View)
│   │   ├── produtor/          # Painel do produtor (View)
│   │   ├── perfil/            # Edição de perfil (View)
│   │   ├── login/             # Autenticação (View)
│   │   ├── completar-perfil/  # Onboarding passo 2 (View)
│   │   ├── api-docs/          # Swagger UI
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Layout global
│   │   └── globals.css        # Design system (.rc-*)
│   ├── components/
│   │   ├── ui/                # Componentes reutilizáveis
│   │   │   ├── Button.tsx     StatCard.tsx   TabNav.tsx
│   │   │   ├── Card.tsx       SearchBar.tsx  EmptyState.tsx
│   │   │   ├── Input.tsx      Select.tsx     Badge.tsx
│   │   │   ├── Modal.tsx      ConfirmModal.tsx
│   │   │   ├── QuantityInput.tsx  ProgressBar.tsx
│   │   │   ├── InfoRow.tsx    SectionHeader.tsx
│   │   │   ├── PageLoader.tsx StatusBanner.tsx
│   │   │   └── TabNav.tsx
│   │   ├── layout/            # SiteHeader, SiteFooter
│   │   └── shared/            # PageLoader, StatusBanner
│   ├── lib/
│   │   └── prisma.ts          # Instância singleton do Prisma
│   ├── middleware.ts           # Proteção JWT de rotas
│   └── swagger.json           # Especificação OpenAPI
└── public/                    # Assets estáticos
```

---

## 🔮 Limitações Atuais e Evoluções Futuras

| Limitação atual | Evolução planejada |
|-----------------|-------------------|
| Entregador existe no banco mas não tem painel | Módulo completo de logística com rastreamento |
| JWT não tem blacklist server-side | Implementar Redis para token revocation |
| Sem notificação em tempo real | WebSockets ou SSE para alertas de novas demandas |
| Sem pagamento integrado | Gateway de pagamento (Stripe, PagSeguro) |
| E-mail via Mailtrap (sandbox) | Provedor de produção (SendGrid, Amazon SES) |

---

## 📄 Licença

Projeto acadêmico desenvolvido para o Projeto Integrador — Fatec Votorantim, curso de Desenvolvimento de Software Multiplataforma (DSM), 2026.
