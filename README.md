# Projeto Integrador: Raiz Conecta

> Solução de Software end-to-end para conectar mercados a produtores rurais de forma direta,  e otimizando a venda de hortifruti.

---

## Integrantes do Projeto Integrador - Fatec Votorantim DSM

Guilherme Vinícius Baeza de Oliveira 

Felipe Gomes Félix  

Jhonatan Melo  

Gustavo Henrique Bauch 

Daniel Henrique Nogueira 

## Visão Geral

Este projeto tem como objetivo desenvolver uma solução completa de software, abrangendo todo o ciclo de vida de desenvolvimento: desde o levantamento de requisitos até a implementação, testes e disponibilização da aplicação.

A solução foi projetada para resolver um problema real de negócio na cadeia de suprimentos de alimentos, utilizando boas práticas de engenharia de software, arquitetura escalável de microsserviços e tecnologias modernas de desenvolvimento.

---

## Problema de Negócio

Atualmente, a cadeia de distribuição de alimentos frescos sofre com ineficiências que prejudicam ambas as pontas do comércio.

- **Qual é o contexto?** Mercados locais enfrentam dificuldades para encontrar fornecedores confiáveis e com preços competitivos, enquanto produtores rurais dependem de intermediários para escoar sua produção.

- **Quem é impactado?** Pequenos e médios produtores rurais, que têm sua margem de lucro reduzida, e pequenos e médios mercados/hortifrutis, que arcam com custos elevados de aquisição.

- **Qual processo ou necessidade precisa ser atendida?** A necessidade de um canal direto de comunicação e vendas que facilite o escoamento da produção, reduza o desperdício de alimentos e garanta produtos frescos ao consumidor final.

---

## Solução Proposta

O **Raiz Conecta** é uma plataforma que atua como a ponte digital entre quem planta e quem vende para o consumidor final.

- **Tipo de sistema:** Plataforma Web B2B (Business-to-Business)

- **Principais funcionalidades:** Catálogo inteligente de produtos, carrinho de cotações, gestão de pedidos fracionados, painel administrativo para moderação e sistema de avaliações de entrega.

- **Tecnologias e arquitetura adotadas:** Aplicação Fullstack com Next.js conectada a um banco de dados relacional em nuvem (PostgreSQL via Neon), e uma arquitetura baseada em microsserviço isolado em Node.js/Express para envio de notificações por e-mail.

- **Diferenciais da solução:** Esteira de validação de usuários (segurança contra fraudes via aprovação manual do Admin) e arquitetura distribuída, garantindo que o sistema principal não perca performance durante o disparo de e-mails.

---

## Arquitetura da Solução

O projeto está dividido em duas frentes de execução (Monorepo), permitindo separação clara de responsabilidades:

**Fluxo Principal (Web):**
```
Usuário (Frontend Next.js) → Rotas de API (Next.js) → Prisma ORM → Banco de Dados (PostgreSQL / Neon)
```

**Fluxo de Notificações (Microsserviço):**
```
Administrador aprova usuário → API Principal → Microsserviço (Express.js) → Nodemailer → Mailtrap
```

---

## Documentação do Projeto

- **Confluence (Base de Conhecimento):** [Acessar Workspace](https://raizconectado.atlassian.net/wiki/x/AYBF)

- **Jira (Gestão Ágil / Roadmap):** [Acessar Timeline](https://raizconectado.atlassian.net/jira/software/projects/SCRUM/boards/1?atlOrigin=eyJpIjoiOTY3Njg2NWQ0NTlhNGFhYWIwNDBiYTUwNDAyMDEwNTIiLCJwIjoiaiJ9)

- **Documento de Requisitos:** Disponível na raiz do repositório (`Doc Projeto Integrador - Raiz Conecta.docx`)

---

## Sprints

| Nº Sprint | Objetivo | Data Início | Data Término |
| :---: | :--- | :---: | :---: |
| **Sprint 1** | Autenticação, cadastro de usuários, painel do produtor, vitrine, carrinho, checkout, painel admin, landing page e avaliações | 2026-04-08 | 2026-04-29 |
| **Sprint 2** | Melhorias e correções apontadas pela banca avaliadora | 2026-04-29 | - |

> Datas precisas e status de cada task disponíveis diretamente no [painel do Jira](https://raizconectado.atlassian.net).

---

## Tecnologias Utilizadas

- **Linguagem:** TypeScript / JavaScript
- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express.js 5, Prisma ORM
- **Banco de Dados:** PostgreSQL (hospedagem serverless via [Neon](https://neon.tech))
- **Notificações:** Nodemailer + Mailtrap
- **Versionamento:** Git / GitHub
- **Gestão:** Jira / Confluence

---

## Funcionalidades

- **Landing Page Pública:** Página de apresentação da plataforma com proposta de valor, fluxo de funcionamento em 3 passos e redirecionamento dinâmico para o painel correto conforme o perfil do usuário logado.

- **Login de Usuário:** Autenticação com e-mail e senha via hash bcrypt, com redirecionamento automático para o painel de Produtor, Mercado ou Administrador.

- **Cadastro de Usuário (Passo 1):** Registro inicial com seleção de perfil (Produtor Rural ou Mercado), criando a conta com status `EM_ANALISE` e disparando e-mail de boas-vindas automaticamente.

- **Completar Perfil / Onboarding (Passo 2):** Segunda etapa obrigatória com preenchimento de CPF/CNPJ, endereço com autocompletar via ViaCEP e upload de documento para validação manual pelo Administrador.

- **Painel Admin — Aprovação de Cadastros:** Interface exclusiva para revisar cadastros pendentes, visualizar documentos enviados e aprovar ou recusar usuários, com disparo automático de e-mail de notificação.

- **Painel Admin — Gestão de Usuários:** Ferramenta de moderação com busca em tempo real, e ações de suspender, reativar ou excluir usuários ativos na plataforma.

- **Catálogo de Produtos (Mercado):** Vitrine com grid de produtos, filtro por categoria (Frutas, Verduras, Legumes), busca em tempo real e controle de quantidade para montar a cotação.

- **Carrinho de Cotação (Mercado):** Painel lateral deslizante para revisar itens selecionados, ajustar quantidades, visualizar total estimado e avançar para o checkout, com persistência via localStorage.

- **Checkout e Disparo de Cotação:** Tela de revisão final com endereço de entrega preenchido automaticamente; ao confirmar, cria uma demanda `ABERTA` no banco para cada item e limpa o carrinho.

- **Acompanhamento de Cotações (Mercado):** Aba com cards por demanda exibindo barra de progresso de preenchimento da carga, lista de produtores que ofertaram e status de cada entrega.

- **Avaliação de Produtor e Entrega:** Após receber um pedido, o mercado confirma o recebimento e avalia o produtor de 1 a 5 estrelas, atualizando o status da entrega para `ENTREGUE`.

- **Mural de Oportunidades (Produtor):** Painel principal do produtor com todas as demandas abertas da região, barra de progresso de preenchimento e campo para registrar uma oferta parcial ou total.

- **Minhas Ofertas Fechadas (Produtor):** Aba histórica com todas as demandas nas quais o produtor já se comprometeu, destacando a quantidade garantida por ele.

- **Meu Perfil — Edição de Dados:** Tela para atualizar nome, telefone, endereço e senha, com e-mail e documento bloqueados para edição.

- **Meu Perfil — Exclusão de Conta:** Autoexclusão permanente com dupla confirmação, limpeza de sessão e redirecionamento para o login, em conformidade com a LGPD.

- **Microsserviço de E-mail:** Serviço Node.js/Express independente que envia e-mails transacionais de boas-vindas, aprovação e rejeição de cadastro, com falha silenciosa para não interromper o fluxo principal.

---

## Resultados Esperados

- **Resolução do problema de negócio:** Democratização do acesso a mercados para o pequeno produtor e vice-versa, eliminando intermediários.

- **Melhoria na eficiência do processo:** Redução do desperdício de alimentos por meio de uma logística direta entre produtor e mercado.

- **Fomento econômico sustentável:** Geração de renda justa para produtores rurais, contribuindo para os Objetivos de Desenvolvimento Sustentável (ODS).

- **Experiência do usuário aprimorada:** Interface SaaS minimalista projetada para usuários com pouca vivência tecnológica.

- **Base escalável para evolução futura:** Arquitetura preparada para a futura inserção de entregadores terceirizados no ecossistema.

---

## Como Executar o Projeto

O projeto possui dois ambientes que devem ser iniciados simultaneamente.

### Pré-requisitos

- Node.js (versão 18+)
- Gerenciador de pacotes npm
- Arquivo `.env` configurado em cada pasta com as credenciais do Neon (Prisma) e do Mailtrap

### Instalação e Execução

**Passo 1 — Clonar o repositório**

```bash
git clone [URL_DO_REPOSITORIO]
cd raiz-conecta
```

**Passo 2 — Rodar a Aplicação Principal (Next.js)**

```bash
cd app-principal
npm install
npx prisma generate
npm run dev
# Disponível em http://localhost:3000

npx prisma studio
# Disponivel em http://localhost:5555
```

**Passo 3 — Rodar o Microsserviço de E-mail (Express.js)**

```bash
cd microservico
npm install
node server.js
# Disponível em http://localhost:3001
```
