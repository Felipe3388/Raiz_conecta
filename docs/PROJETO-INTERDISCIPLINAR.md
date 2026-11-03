# Raiz Conecta — Projeto Interdisciplinar

> Voltar ao [README](../README.md). Esta página guarda a parte acadêmica do projeto (problema, público, ODS, sprints,
> equipe e referências). Como usar o sistema está no [Guia de uso](GUIA-DE-USO.md); como o código é organizado, em
> [app-principal/ARQUITETURA.md](../app-principal/ARQUITETURA.md) e [app-mobile/ARQUITETURA.md](../app-mobile/ARQUITETURA.md).

## Curso Superior de Desenvolvimento de Software Multiplataforma — Fatec Votorantim

**Projeto Interdisciplinar** · Engenharia de Software II · Desenvolvimento Web III · Gestão Ágil de Projetos de Software

| Integrantes |
|---|
| Daniel Henrique Domingues Nogueira 
| Felipe Gomes Felix 
| Guilherme Vinícius Baeza de Oliveira 
| Gustavo Henrique Bauch 
| Jhonatan Melo de Oliveira 

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
| 📦 **Repositório GitHub** | https://github.com/Felipe3388/Raiz_conecta |
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

## Descrição do Projeto

### Proposta do Software

O Raiz Conecta consiste em uma plataforma digital de natureza B2B desenvolvida com o objetivo de modernizar a relação comercial entre produtores rurais e estabelecimentos varejistas. Em sua versão atual (MVP), a plataforma está delimitada ao escopo de pequenos e médios produtores e mercados, sem contemplar módulo de entregadores e pagamento integrado, previstos para versões futuras.

### Objetivos de Desenvolvimento Sustentável (ODS)

O projeto contribui diretamente para os ODS da ONU, especialmente:
- **ODS 2** — Fome zero e agricultura sustentável
- **ODS 8** — Trabalho decente e crescimento econômico
- **ODS 12** — Consumo e produção responsáveis

---

## Gestão Ágil — Sprints

| Sprint | Objetivo | Início | Fim |
|---|---|---|---|
| **Sprint 1** | Autenticação, cadastro, painel admin, catálogo, carrinho, checkout, painel produtor, landing page, avaliações, microsserviço de e-mail | 08/04/2026 | 29/04/2026 |
| **Sprint 2** | Melhorias pós-banca: componentização, design system `.rc-*`, filtros avançados, validação regex, cancelamento de pedido, API docs JWT, correções SCRUM-144 a 147 | 29/04/2026 | 02/06/2026 |

**Total:** 14+ histórias entregues · 49+ story points · 2 sprints ·

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
