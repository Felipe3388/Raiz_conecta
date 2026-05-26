# Raiz Conecta — App Principal

Next.js 16 | TypeScript | Prisma | Cloudinary | JWT

## Deploy no Vercel

### 1. Variáveis de Ambiente obrigatórias

Configure no painel do Vercel em **Settings → Environment Variables**:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL (ex: Neon, Supabase) |
| `JWT_SECRET` | Chave secreta para tokens JWT (mín. 32 caracteres) |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary |
| `MICROSERVICE_URL` | URL do microsserviço app-node (ex: Railway) |
| `ADMIN_SENHA_INICIAL` | Senha para o setup do primeiro admin |

### 2. Banco de dados

```bash
npx prisma migrate deploy
```

### 3. Criar o primeiro Admin

Após o deploy, acesse:
```
https://seu-app.vercel.app/api/setup-admin
```
Esse endpoint cria o admin usando a senha definida em `ADMIN_SENHA_INICIAL`.
**Remova ou proteja essa rota após o primeiro uso.**

### 4. Microsserviço (app-node)

O microsserviço precisa ser hospedado separadamente (Railway, Render, etc.).
Após hospedar, configure `MICROSERVICE_URL` com a URL gerada.

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# Edite .env.local com suas credenciais
npx prisma generate
npx prisma db push
npm run dev
```

## Funcionalidades

- **Autenticação JWT** com cookie seguro e middleware de proteção de rotas
- **Upload de imagens via Cloudinary** (persistente no Vercel)
- **Painel Admin** com gestão de usuários, produtos e sugestões
- **Painel Produtor** com estoque, ofertas e sugestão de produtos
- **Painel Mercado** com catálogo, demandas e checkout
- **Swagger** em `/api-docs`
- **Microsoft Clarity** para analytics
