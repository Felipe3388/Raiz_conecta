# IoT — balança do produtor

Como a balança (módulo **ESP32 + célula de carga**) conversa com o Raiz Conecta. A balança entra na conta do produtor
pelo **pareamento estilo lâmpada inteligente**, feito no app (seção abaixo). O firmware está em
`docs/iot/raiz_balanca/raiz_balanca.ino` (2.0.0) e **ainda não foi testado em hardware**: foi escrito contra a API do
ESP32 Arduino e checado só em sintaxe; o servidor e o app estão testados com balança simulada.

## Visão geral

```
 ┌──────────────┐  HTTPS (Wi-Fi)        ┌────────────────────┐   consulta a cada 0,5 s   ┌──────────────┐
 │ ESP32 + HX711│ ───────────────────▶  │  app-principal     │ ◀──────────────────────── │ App mobile   │
 │ (balança)    │  POST /api/iot/       │  /api/iot/*        │   GET /api/produtor/      │ (produtor)   │
 └──────────────┘  leituras             │  banco (Postgres)  │   balancas/{id}/leitura   └──────────────┘
```

- **O módulo só fala com o servidor**, nunca com o celular. Assim a balança funciona para qualquer app (mobile ou site)
  e o servidor sabe quando ela caiu.
- **Quem decide se o peso "parou" é o módulo** (`estavel: true`); a regra do app (`lib/delivery/scale.ts`) confere de
  novo, igual para qualquer balança.
- O servidor guarda **a última leitura** na própria balança (é o que o app mostra ao vivo) e, no histórico
  (`leituras_peso`), **só os pesos estáveis e diferentes do anterior**. O histórico guarda 90 dias.

## Pareamento (estilo lâmpada inteligente)

```
 App (produtor)                     Balança (ESP32)                         Servidor
      │  1. POST /pareamento ─────────────────────────────────────────────────▶│ token (15 min)
      │◀───────────────────────────────────────────────────────── {id, token} │
      │  2. entra na rede Balanca_raiz_XXXX (aberta, sem internet)             │
      │  3. GET /info, /redes ─────────▶│                                      │
      │  4. POST /configurar (Wi-Fi + token) ─▶│ 5. entra no Wi-Fi do produtor │
      │     volta ao Wi-Fi/dados normais        │ 6. POST /api/iot/vincular ──▶│ cria/vincula a balança,
      │                                         │◀──────────── {segredo} ───────│ gera o segredo
      │  7. GET /pareamento/{id} (a cada 2,5 s) ──────────────────────────────▶│
      │◀──────────────────────────────── {estado: vinculada, pronta: true} ────│  (pronta = já enviando sinal)
```

| Etapa | Quem | O que acontece |
| --- | --- | --- |
| 1. Primeira ligação | Balança | Sem Wi-Fi gravado, abre a rede **aberta** `Balanca_raiz_XXXX` (XXXX = 4 últimos dígitos do MAC) por **10 min** e atende em `http://192.168.4.1`. O LED pisca devagar. Passados os 10 min a rede fecha: ligue de novo ou segure o botão BOOT por 5 s. |
| 2. Token | App | Pede `POST /api/produtor/balancas/pareamento` **antes** de entrar na rede da balança (nela o celular não tem internet). Token de 256 bits, vale 15 min; só o hash vai ao banco. |
| 3. Rede da balança | App | Confere se está na rede dela chamando `GET /info` (não lê o SSID: isso exigiria permissões extras). Se não estiver: **Android com build de desenvolvimento** entra sozinho (procura `Balanca_raiz_*`; pede a permissão de localização, que o Android exige para listar redes); **qualquer outro caso** abre o Wi-Fi do celular e espera o produtor entrar (a checagem do `/info` segue sozinha). |
| 4. Wi-Fi do produtor | App + balança | A balança lista as redes **2,4 GHz** que enxerga (`GET /redes`); o produtor escolhe (ou digita) e informa a senha. `POST /configurar` entrega Wi-Fi + token. |
| 5. Vínculo | Balança → servidor | Entra no Wi-Fi e chama `POST /api/iot/vincular`. O servidor registra a balança já no nome do produtor do token, **gera o segredo** e o devolve uma única vez; a balança o grava na memória flash. |
| 6. Pronta | App | De volta à internet, consulta o servidor até `pronta: true` (vinculada e enviando sinal). A balança já é a conectada do produtor. |
| 7. Recomeçar | Produtor | Segurar **BOOT por 5 s** apaga o Wi-Fi e reabre o pareamento (o segredo fica, como prova de posse). "Remover" no app (ou "Liberar" no admin) solta a balança e apaga o histórico; a balança descobre no próximo envio (`vinculada: false`) e volta sozinha ao pareamento. |

### Rede da balança (`http://192.168.4.1`, só no modo de pareamento)

| Rota | Para quê |
| --- | --- |
| `GET /info` | `{ app: "raiz-balanca", deviceId, firmware, ssid, fase }`. É assim que o app sabe que está falando com uma balança Raiz. |
| `GET /redes[?atualizar=1]` | `{ buscando, redes: [{ ssid, rssi, aberta }] }`. A busca é assíncrona: repita até `buscando: false`. |
| `POST /configurar` (formulário `ssid`, `senha`, `token`) | Responde `{ ok: true }` na hora e segue sozinha. `400` dados inválidos; `409` já ocupada. |
| `GET /estado` | `{ fase: aguardando\|conectando\|vinculando\|ok\|erro, erro: wifi\|token\|outra-conta\|servidor }`. Quando a balança entra no Wi-Fi do produtor ela some da rede dela e o app segue pelo servidor. |

### Balança que já tem dono

- **Balança nova** (MAC desconhecido): registrada no nome do produtor do token.
- **Mesmo dono** (trocou de Wi-Fi): vale; o segredo é renovado e o apelido fica.
- **Livre** (removida pelo dono / liberada pelo admin): vale; apelido e histórico do dono anterior já tinham saído.
- **De outra conta**: só troca de dono se o módulo **apresentar o segredo que ainda guarda**
  (`Authorization: Device <segredo>`), ou seja, quem tem a balança na mão e a reiniciou pelo botão (que mantém o segredo).
  Sem a prova: `409` e o app mostra "vinculada a outra conta". Flash apagado + dono antigo ativo: o dono precisa remover a balança.
- O mesmo token pode ser repetido **pelo mesmo módulo** até vencer (se a resposta se perder no Wi-Fi, ele tenta de novo e recebe um segredo novo).

## Autenticação do módulo

Cada requisição do módulo leva:

```
X-Device-Id: A4:CF:12:9B:07:E1
Authorization: Device <segredo de 64 caracteres>
```

- O segredo é aleatório (256 bits); o servidor guarda `SHA-256(segredo)` e compara em tempo constante.
- Qualquer falha (balança desconhecida, segredo errado, cabeçalho faltando) responde igual: `401 {"error":"Balança não autorizada."}`.
- Segredo vazou? Remova/libere a balança e refaça o pareamento: o novo segredo invalida o antigo na hora.
- Um token de usuário (JWT) **não** serve de credencial de balança, e o segredo da balança não abre nenhuma rota de usuário.

## Rotas do módulo

### `POST /api/iot/vincular`

Sem segredo (é onde ele nasce). Cabeçalho `X-Device-Id`; `Authorization: Device <segredo antigo>` é opcional (prova de
posse, ver acima). Corpo: `{ "token": "<64 hex>", "firmware": "2.0.0" }`.

- `200`: `{ ok, segredo, hora, vinculada: true, intervaloAtivoMs, intervaloOciosoMs, lote }`. `Cache-Control: no-store`.
- `401`: token fora do formato, desconhecido, vencido ou usado por outro módulo (a mesma resposta para todos).
- `409`: a balança é de outra conta e o módulo não provou posse. `400`: `X-Device-Id` inválido.
- `429`: 10 erros de token em 15 min por IP.

### `POST /api/iot/leituras`

```json
{ "firmware": "2.0.0", "leituras": [ { "kg": 1.250, "estavel": true, "t": 1730000000000 } ] }
```

- `kg`: de 0 a 500 (ruído negativo até −0,5 vira 0). Guardado com 3 casas.
- `estavel`: `true` quando o peso parou. Omitido = `false`.
- `t`: instante da leitura em ms (opcional). Se faltar, ou estiver a mais de 5 min da hora do servidor, vale a hora do servidor.
- Até 50 leituras por envio. **Lista vazia = batimento** ("estou vivo"); mantém a balança "no ar".
- Resposta `200`: `{ "ok": true, "hora": 1730000000123, "vinculada": true }`. O módulo pode usar `hora` para acertar o relógio.
- Erros: `400` (corpo inválido, `kg` fora do intervalo), `401` (credencial).

### `GET /api/iot/config`

Como o módulo deve se comportar: `{ hora, vinculada, intervaloAtivoMs: 500, intervaloOciosoMs: 5000, lote: 10 }`.
Muda o ritmo de envio sem regravar o firmware.

## Rotas do app (produtor logado)

O e-mail é sempre o da sessão; balança de outra conta responde `404`, como se não existisse. Não há `POST` para vincular
por MAC: a balança só entra na conta pelo pareamento.

| Rota | Para quê |
| --- | --- |
| `GET /api/produtor/balancas` | `{ scales: [{ deviceId, deviceName, nickname, key, linkedAt }], activeDeviceId }` |
| `POST /api/produtor/balancas/pareamento` | Abre um pareamento: `201 { id, token, expiraEm }`. O token aparece só aqui. Um pareamento aberto por produtor (o anterior não usado é descartado); `429` depois de 10 pedidos em 15 min. |
| `GET /api/produtor/balancas/pareamento/{id}` | `{ estado: aguardando\|vinculada\|recusada\|expirada, pronta, deviceId, balanca, mensagem }`. `pronta` = vinculada e já enviando. Sem cache; de outro produtor responde `404`. |
| `PUT /api/produtor/balancas/{id}/conectada` | Passa a usar esta balança. |
| `PATCH /api/produtor/balancas/{id}` `{ apelido }` | Renomeia (até 30 letras; vazio/`null` volta ao nome de fábrica). |
| `DELETE /api/produtor/balancas/{id}` | Remove da conta (e apaga o histórico). |
| `GET /api/produtor/balancas/{id}/leitura` | `{ online, kg, estavel, em, agora }`. Sem contato há mais de 15 s: `online:false` e `kg:null` (nunca devolve peso velho). Sem cache. |

`{id}` aceita o MAC em qualquer forma (`A4:CF:12:9B:07:E1`, `a4cf129b07e1`...).

## Rotas do administrador

| Rota | Para quê |
| --- | --- |
| `GET /api/admin/balancas` | Todas, com dono, sinal (`online`), firmware e último peso. |
| `PATCH /api/admin/balancas/{id}` `{ liberar: true }` | Desvincula do produtor (apaga o histórico dele). |
| `DELETE /api/admin/balancas/{id}` | Remove do sistema. |

O administrador **não cadastra** balanças nem vê segredos: elas nascem no pareamento do produtor.

## Banco

`prisma/schema.prisma` tem `Balanca`, `LeituraPeso` e `PareamentoBalanca` (token de pareamento, só o hash). Para o banco já existente:

```bash
npx prisma db push          # ou aplique prisma/migrations/1_iot_balancas e 3_pareamento_balanca
```

A migração cria também um índice único parcial: **cada produtor tem no máximo uma balança conectada**, mesmo se duas
chamadas chegarem juntas.

## Testar sem hardware

```bash
# 1. como produtor (TOKEN_PRODUTOR = login), abra um pareamento
curl -X POST https://SEU-SITE/api/produtor/balancas/pareamento -H "Authorization: Bearer $TOKEN_PRODUTOR"
# → { "id": "...", "token": "<64 hex>", "expiraEm": "..." }

# 2. o "módulo" conclui o pareamento e recebe o segredo
curl -X POST https://SEU-SITE/api/iot/vincular \
  -H "Content-Type: application/json" -H "X-Device-Id: A4:CF:12:9B:07:E1" \
  -d '{"token":"<token do passo 1>","firmware":"2.0.0"}'
# → { "ok": true, "segredo": "<64 hex>", ... }
SEGREDO=...

# 3. o módulo manda um peso estável
curl -X POST https://SEU-SITE/api/iot/leituras \
  -H "Content-Type: application/json" -H "X-Device-Id: A4:CF:12:9B:07:E1" -H "Authorization: Device $SEGREDO" \
  -d '{"leituras":[{"kg":1.25,"estavel":true}]}'

# 4. o app (ou curl) lê ao vivo e vê o pareamento pronto
curl https://SEU-SITE/api/produtor/balancas/A4:CF:12:9B:07:E1/leitura -H "Authorization: Bearer $TOKEN_PRODUTOR"
```

No app, `EXPO_PUBLIC_USE_MOCKS=true` simula o pareamento inteiro (rede da balança, lista de Wi-Fi e vínculo).

## Build do app para o pareamento (app-mobile)

- Entrar sozinho na rede da balança usa o módulo nativo `react-native-wifi-reborn` (**só Android**) e exige **build de
  desenvolvimento** (`eas build --profile development` ou `npx expo run:android`); no **Expo Go** o app cai no modo
  manual (abre o Wi-Fi do celular). iOS também usa o modo manual (a conexão automática exigiria a capability Hotspot
  Configuration; o `eas.json` ainda não tem build iOS).
- `plugins/withScaleLocalHttp.js` libera HTTP **só** para `192.168.4.1` (Android: `network_security_config.xml`; iOS:
  `NSAllowsLocalNetworking`). O resto do app continua só HTTPS.
- Permissão `ACCESS_FINE_LOCATION`: o Android só deixa listar redes Wi-Fi com ela; o app não usa a localização para mais nada.
- A biblioteca `react-native-wifi-reborn` não recebe atualização desde 06/2025 e usa a ponte antiga do React Native;
  não foi validada com o RN 0.86 em aparelho. Está isolada em `NativeScaleNetworkService`: se der problema, troca-se só ele.

## Segurança e limites

- **HTTPS obrigatório.** No firmware de exemplo `client.setInsecure()` só existe para facilitar a bancada; em produção
  use `setCACert` com o certificado raiz do domínio.
- **A rede da balança é aberta** (decisão de produto): durante os poucos segundos do pareamento o Wi-Fi do produtor e o
  token trafegam sem criptografia no ar, ao alcance de quem estiver ao lado. Mitigações: janela de 10 min, token que vale
  15 min e só 1 vez (ou repetido pelo mesmo módulo), e o servidor nunca devolve o segredo a quem não tem o token. Se isso
  for um risco para o público, use AP com senha impressa na balança (`WiFi.softAP(nome, senha)` + o app a pede).
- **Sem segredo de fábrica**, quem chamar `POST /api/iot/vincular` com um token próprio e o MAC de uma balança que ainda
  não foi pareada pode "reservá-la" antes do dono (o MAC é previsível). O dono recebe "vinculada a outra conta" e o admin
  libera. Não dá para tomar uma balança já vinculada (exige o segredo). Se virar problema real, volte a ter uma prova de
  fábrica (segredo/código gravado por balança).
- Tokens: 10 pedidos em 15 min por produtor; 10 erros de token em 15 min por IP. Os limitadores são por instância; para
  um limite global use um armazenamento compartilhado (Redis/Upstash) trocando só `FailureLimiter`.
- A chave `key` do vínculo é um HMAC do par produtor + balança com o segredo do servidor (`JWT_SECRET`): não dá para forjar.
- O servidor **nunca confia no relógio do módulo** (ESP32 sem RTC): hora fora de 5 min vira a do servidor.
- Cada envio faz 1 escrita (`balancas`) e, só quando o peso muda e para, 1 gravação no histórico. Um módulo mandando a
  cada 500 ms gera ~2 escritas/s enquanto há peso e ~1 a cada 5 s parado.

## Próximos passos (quando o hardware existir)

1. **Bluetooth (BLE) direto com o celular**: menos latência que passar pelo servidor. O módulo anuncia o MAC; o app lê
   o peso e ainda envia ao servidor para o histórico. O contrato do app (`ScaleGateway`) já isola isso: troca-se só o
   serviço, não as telas.
2. **OTA**: o `firmware` enviado a cada batimento permite ao admin saber quem está desatualizado.
3. **Calibração remota**: guardar o fator de calibração por balança e entregá-lo em `/api/iot/config`.
4. **Alerta de balança fora do ar**: hoje a tela do admin mostra "sem sinal"; um aviso por e-mail é um passo pequeno.
