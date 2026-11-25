# Atualizações de interface — branch main (24/11/2026)

## Objetivo

A proposta do Raiz Conecta é conectar mercados que precisam comprar com produtores que podem ofertar. A balança é um recurso auxiliar de pesagem, não o centro da apresentação pública.

## 1. Atualização por gesto no aplicativo

- Catálogo, Pedidos, Entregas, Painel, Mais, Perfil e Configurações aceitam **arrastar a lista para baixo** em Android/iOS (indicador nativo `RefreshControl`).
- A tela **Conexão com a balança** também pode ser atualizada por gesto, além do ícone de atualizar.
- A versão Expo Web exibe **Atualizar dados** no cabeçalho de listas e formulários porque o gesto nativo não está disponível nessa plataforma.
- Cada tela chama sua própria função de atualização: Catálogo/Pedidos -> dados do produtor; Entregas -> entregas e catálogo de produtos; Painel -> dados do produtor e entregas; Mais/Balança/Configurações -> balanças da conta; Perfil -> dados cadastrais sem descartar campos alterados.
- São atualizações silenciosas: mantêm os dados visíveis durante a requisição e informam falhas sem descartar o conteúdo anterior.
- O Catálogo preserva seleções não salvas, bem como os filtros de busca. Os filtros e a rolagem das demais telas também continuam como estavam.
- A atualização **não** refaz login nem exclui dados. Não conflita com o `reload()` inicial que permanece disponível para a tela de erro.

## 2. Balanças: interface inspirada em Wi-Fi, no site e no mobile

- Web: `app-principal/src/app/produtor/balancas/page.tsx` e `components/balanca/ScaleCard.tsx`.
- Mobile: `app-mobile/src/app/(produtor)/balanca.tsx` e `components/produtor/ScaleCard.tsx`.
- Exibe balanças vinculadas à conta, selecionada no topo, ação para conectar outra, remoção com confirmação e inclusão por etiqueta. O site preserva renomear.
- Se o gateway mobile estiver em modo `scan`, mostra os dispositivos descobertos pelo gateway; caso contrário, exige endereço e código de segurança da etiqueta.
- **Limitação importante:** a API atual NÃO implementa varredura da rede Wi-Fi, Bluetooth ou BLE no celular/navegador. A lista é de balanças salvas pelo servidor. A tela não inventa dispositivos próximos nem qualidade de sinal; descobrir dispositivos fisicamente exigiria um protocolo e infraestrutura adicionais.

## 3. Missão nas telas públicas e no README

- A animação `HeroFlow` mostra um pedido de mercado (120 kg) completado pelas ofertas de **dois produtores** (80 kg e 40 kg), no lugar do mostrador de peso ao vivo.
- Texto da hero, passos de funcionamento, seção escura e links de navegação focam na conexão direta entre mercado e produtor.
- README e banner animado `docs/readme/banner.svg` reforçam a mesma missão, com visual harmonizado ao GIF (sem painel de balança).
- Novo GIF horizontal `docs/readme/demo-conexao-mercados-produtores.gif` recriado no estilo do banner SVG de referência: verde-escuro, grade, cartões de pedido/oferta e conexão animada entre mercado e produtores. Substitui, na apresentação do README, os GIFs antigos de pesagem/balança. O GIF é uma **ilustração de conceito**, não captura do app em execução.
- A pesagem continua documentada como funcionalidade técnica, e as APIs de balança não foram removidas.

## Testar no projeto

```powershell
# Primeiro mantenha uma cópia do seu trabalho local!
git status
git switch main
git pull --ff-only origin main
# Copie os arquivos deste ZIP para a cópia da branch main (sem sobrescrever .git nem segredos .env)

cd app-principal
npm install
npm run build
cd ../app-mobile
npm install
npm run typecheck
npx expo start -c
```

Testes manuais: puxar cada aba para baixo sem perder filtros, conectar e remover balança, testar etiqueta inválida, confirmar no site que a landing não mostra animação de peso, verificar `prefers-reduced-motion`, e confirmar o novo GIF no README.

**Atenção**: o ZIP foi gerado a partir da pasta `Raiz_conecta-main` fornecida no chat. O ZIP não contém um histórico Git `.git` conectado ao repositório remoto. **Nenhum commit nem push para `main` foi realizado automaticamente.** Revise em sua cópia de trabalho e envie para a branch correta, evitando `teste`.
