# IoT — balança do produtor

Como a balança (módulo **ESP32 + célula de carga**) conversa com o Raiz Conecta. O módulo ainda não existe fisicamente:
tudo abaixo já está pronto no servidor e no app, e foi testado com leituras simuladas. Quando o hardware chegar, basta
gravar o firmware de exemplo (`docs/iot/raiz_balanca/raiz_balanca.ino`) e cadastrar a balança.

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

## Vida da balança

| Etapa | Quem | O que acontece |
| --- | --- | --- |
| 1. Cadastro | Administrador (site → Balanças) | Informa o MAC do módulo. O servidor devolve o **segredo** (aparece uma vez) e mostra o **código da etiqueta**. No banco fica só o hash do segredo. |
| 2. Gravação | Quem monta | Grava o firmware com o segredo e cola a etiqueta (MAC + código) na balança. |
| 3. Vínculo | Produtor (app → Configurações → Balança) | Digita o código da etiqueta. A balança passa a ser dele e fica conectada. O MAC sozinho não basta: ninguém toma a balança de outro sabendo só o endereço. |
| 4. Pesagem | Produtor | O app consulta a balança conectada e narra o peso. |
| 5. Troca de dono | Produtor ou admin | "Remover" (produtor) ou "Liberar" (admin) solta a balança e **apaga o histórico** daquele dono. |

## Autenticação do módulo

Cada requisição do módulo leva:

```
X-Device-Id: A4:CF:12:9B:07:E1
Authorization: Device <segredo de 64 caracteres>
```

- O segredo é aleatório (256 bits); o servidor guarda `SHA-256(segredo)` e compara em tempo constante.
- Qualquer falha (balança desconhecida, segredo errado, cabeçalho faltando) responde igual: `401 {"error":"Balança não autorizada."}`.
- Segredo vazou? Admin → Balanças → **Novo segredo**: o antigo para de valer na hora; regrave o módulo.
- Um token de usuário (JWT) **não** serve de credencial de balança, e o segredo da balança não abre nenhuma rota de usuário.

## Rotas do módulo

### `POST /api/iot/leituras`

```json
{ "firmware": "1.0.0", "leituras": [ { "kg": 1.250, "estavel": true, "t": 1730000000000 } ] }
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

O e-mail é sempre o da sessão; balança de outra conta responde `404`, como se não existisse.

| Rota | Para quê |
| --- | --- |
| `GET /api/produtor/balancas` | `{ scales: [{ deviceId, deviceName, nickname, key, linkedAt }], activeDeviceId }` |
| `POST /api/produtor/balancas` `{ deviceId, codigo }` | Vincula (código da etiqueta) e conecta. `201`; `404` código/balança errados; `409` já é de outra conta; `429` muitas tentativas. |
| `PUT /api/produtor/balancas/{id}/conectada` | Passa a usar esta balança. |
| `PATCH /api/produtor/balancas/{id}` `{ apelido }` | Renomeia (até 30 letras; vazio/`null` volta ao nome de fábrica). |
| `DELETE /api/produtor/balancas/{id}` | Remove da conta (e apaga o histórico). |
| `GET /api/produtor/balancas/{id}/leitura` | `{ online, kg, estavel, em, agora }`. Sem contato há mais de 15 s: `online:false` e `kg:null` (nunca devolve peso velho). Sem cache. |

`{id}` aceita o MAC em qualquer forma (`A4:CF:12:9B:07:E1`, `a4cf129b07e1`...).

## Rotas do administrador

| Rota | Para quê |
| --- | --- |
| `GET /api/admin/balancas` | Todas, com dono, sinal (`online`), firmware, último peso e `codigo` da etiqueta. |
| `POST /api/admin/balancas` `{ deviceId, nome? }` | Cadastra. Devolve `{ balanca, segredo }` — **o segredo só aparece aqui**. |
| `POST /api/admin/balancas/{id}/segredo` | Gera segredo novo (o antigo deixa de valer). |
| `PATCH /api/admin/balancas/{id}` `{ liberar: true }` | Desvincula do produtor. |
| `DELETE /api/admin/balancas/{id}` | Remove do sistema. |

## Banco

`prisma/schema.prisma` ganhou `Balanca` e `LeituraPeso`. Para o banco já existente:

```bash
npx prisma db push          # ou aplique prisma/migrations/1_iot_balancas/migration.sql
```

A migração cria também um índice único parcial: **cada produtor tem no máximo uma balança conectada**, mesmo se duas
chamadas chegarem juntas.

## Testar sem hardware

```bash
# 1. no site, como admin, cadastre a balança (ou: POST /api/admin/balancas) e guarde o segredo
SEGREDO=...   # 64 caracteres

# 2. o "módulo" manda um peso estável
curl -X POST https://SEU-SITE/api/iot/leituras \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: A4:CF:12:9B:07:E1" \
  -H "Authorization: Device $SEGREDO" \
  -d '{"leituras":[{"kg":1.25,"estavel":true}]}'

# 3. o app (ou curl com o token do produtor) lê ao vivo
curl https://SEU-SITE/api/produtor/balancas/A4:CF:12:9B:07:E1/leitura -H "Authorization: Bearer $TOKEN"
```

## Segurança e limites

- **HTTPS obrigatório.** No firmware de exemplo `client.setInsecure()` só existe para facilitar a bancada; em produção
  use `setCACert` com o certificado raiz do domínio.
- O vínculo exige o **código da etiqueta**; 8 erros em 15 min travam o produtor por um tempo (`429`). O limitador é por
  instância; para um limite global use um armazenamento compartilhado (Redis/Upstash) trocando só `FailureLimiter`.
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
