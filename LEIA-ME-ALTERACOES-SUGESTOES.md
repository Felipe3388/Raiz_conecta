# Raiz Conecta — Histórico real de sugestões (Mobile + Web + PostgreSQL)

## Objetivo
A tela **Catálogo → Minhas sugestões** no app mobile deixa de utilizar sugestões/status simulados e consulta a API do app principal. A equipe administrativa pode **aprovar** (promover produto) ou **recusar** (com motivo), preservando o registro da solicitação no banco.

## Alterações
- **Banco / Prisma:** `Sugestao.status`, `Sugestao.motivo`, `Sugestao.decididoEm`; migração `2_historico_sugestoes`. Registros que ainda existem no banco serão marcados `EM_ANALISE` na migração.
- **API:** `GET /api/produtor/sugestao` devolve apenas as sugestões do produtor autenticado; o admin recebe pendentes (e todas com `?status=all`). `POST` devolve o ID real. `PATCH` (admin) marca como `RECUSADA`, registra motivo e data. `DELETE` permite ao próprio produtor retirar a sugestão ainda pendente (Desfazer).
- **Admin:** promover ao catálogo mantém a sugestão com `APROVADA` (na mesma transação), em vez de excluí-la; a opção **Recusar sugestão** substitui **Descartar**.
- **Mobile:** serviço real `ApiCatalogService` consulta a API, inclusive para status e Desfazer; o modal **Minhas sugestões** apresenta a data do envio, data de avaliação, situação e motivo, quando presente. O modo mock continua disponível somente se solicitado com `EXPO_PUBLIC_USE_MOCKS=true`.
- **Imagens de Pedidos e Entregas:** mantidas as alterações anteriores, incluindo a correção de `imageUrlOf` em `ofertas.tsx`.

## Para aplicar no seu ambiente
1. Faça backup do banco PostgreSQL.
2. No `app-principal`, configure a `DATABASE_URL` correta no seu `.env.local` (não publique esse arquivo).
3. Execute no `app-principal`: `npx prisma migrate deploy` e `npx prisma generate`.
4. Reinicie o backend Next.js.
5. No `app-mobile/.env`, use `EXPO_PUBLIC_USE_MOCKS=false` e defina `EXPO_PUBLIC_API_URL` apontando ao backend (`http://localhost:3000` no navegador local; no celular real use IP acessível da máquina). Reinicie o Expo, se necessário limpando cache (`npx expo start -c`).
6. Teste: enviar sugestão → ver em análise → admin aprovar ou recusar → reabrir Minhas sugestões → conferir status e motivo. Teste também o Desfazer enquanto estiver pendente.

## Limitações e atenção
- A migração **não recupera sugestões já excluídas no passado**. Apenas preserva as novas decisões e os registros que ainda existirem no banco.
- A alteração foi revisada estaticamente, mas **não foi testada contra seu PostgreSQL real, nem com Next.js/Expo rodando**, pois faltam dependências, credenciais e o serviço do seu ambiente.
- Os demais fluxos do app (como preços ou pesagens, se ainda estiverem mockados) não foram substituídos nesta etapa.
