// Gera src/swagger.json (a documentação da API em /api-docs). Edite aqui e rode `npm run docs:api`.
// Um teste (src/swagger.test.ts) confere que toda rota de src/app/api está documentada.
import { writeFileSync } from "node:fs";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ "application/json": { schema } });
const obj = (properties, required = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
const str = (example, extra = {}) => ({ type: "string", ...(example !== undefined ? { example } : {}), ...extra });
const num = (example, extra = {}) => ({ type: "number", ...(example !== undefined ? { example } : {}), ...extra });
const int = (example) => ({ type: "integer", ...(example !== undefined ? { example } : {}) });
const bool = (example) => ({ type: "boolean", ...(example !== undefined ? { example } : {}) });
const arr = (items) => ({ type: "array", items });

const ERRORS = {
  400: "Dados inválidos (a mensagem diz o que corrigir).",
  401: "Sem sessão ou sessão vencida.",
  403: "Sem permissão para este recurso.",
  404: "Não encontrado.",
  409: "Conflito com o estado atual.",
  422: "Regra de negócio não atendida.",
  429: "Muitas tentativas; veja o cabeçalho Retry-After.",
  500: "Erro interno (sem detalhes).",
};
const res = (code, description, schema) => ({ [code]: { description, ...(schema ? { content: json(schema) } : {}) } });
const errors = (...codes) => Object.fromEntries(codes.map((code) => [code, { description: ERRORS[code], content: json(ref("Erro")) }]));
const ok = (description, schema) => res(200, description, schema);
const message = ref("Mensagem");

const BEARER = [{ BearerAuth: [] }, { CookieAuth: [] }];
const DEVICE = [{ DeviceAuth: [] }];
const idParam = { name: "id", in: "path", required: true, description: "Endereço MAC da balança (A4:CF:12:9B:07:E1 ou só os 12 caracteres).", schema: str("A4:CF:12:9B:07:E1") };
const emailQuery = { name: "email", in: "query", required: false, description: "Aceito só por compatibilidade com apps antigos; precisa ser o e-mail da própria sessão.", schema: str("maria@exemplo.com") };

function op(tag, summary, { description, security = BEARER, parameters, body, responses }) {
  return {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    ...(security.length ? { security } : {}),
    ...(parameters ? { parameters } : {}),
    ...(body ? { requestBody: body } : {}),
    responses,
  };
}
const jsonBody = (schema, required = true) => ({ required, content: json(schema) });

const paths = {
  "/api/auth/cadastro": {
    post: op("Auth", "Cria a conta (passo final do cadastro)", {
      description: "Multipart: dados do passo 1 e 2 + foto/PDF do documento (até 5 MB). A conta nasce EM_ANALISE até a administração aprovar.",
      security: [],
      body: { required: true, content: { "multipart/form-data": { schema: ref("CadastroInput") } } },
      responses: { ...res(201, "Conta criada.", message), ...errors(400, 409, 500) },
    }),
  },
  "/api/auth/login": {
    post: op("Auth", "Entra na conta", {
      description: "Devolve o token (usado pelo app mobile no cabeçalho Authorization) e também grava o cookie httpOnly `token` (usado pelo site). 5 senhas erradas em 15 min travam novas tentativas.",
      security: [],
      body: jsonBody(ref("LoginInput")),
      responses: { ...ok("Login realizado.", ref("LoginResponse")), ...errors(400, 401, 403, 429, 500) },
    }),
  },
  "/api/auth/logout": {
    post: op("Auth", "Sai da conta", { description: "Apaga o cookie da sessão.", security: [], responses: ok("Sessão encerrada.", message) }),
  },
  "/api/auth/me": {
    get: op("Auth", "Quem está logado agora", {
      description: "Nome e situação da conta vêm do banco (não do token), então refletem aprovação e troca de nome.",
      responses: { ...ok("Sessão atual.", ref("SessaoAtual")), ...errors(401, 500) },
    }),
  },
  "/api/perfil/meus-dados": {
    get: op("Perfil", "Dados da própria conta", { parameters: [emailQuery], responses: { ...ok("Dados do produtor ou mercado (sem senha nem link do documento).", ref("PerfilCompleto")), ...errors(401, 403, 404, 500) } }),
    put: op("Perfil", "Altera dados e/ou senha", {
      description: "Só os campos editáveis entram. Para trocar a senha é obrigatório enviar `senhaAtual` (5 erros em 15 min travam). Dados e senha são gravados juntos ou nenhum.",
      body: jsonBody(ref("PerfilInput")),
      responses: { ...ok("Perfil atualizado.", message), ...errors(400, 401, 403, 404, 429, 500) },
    }),
    delete: op("Perfil", "Exclui a própria conta", {
      description: "Apaga login e perfil numa transação e o cookie. Responde 409 se houver pedidos ou ofertas ligados.",
      parameters: [emailQuery],
      responses: { ...ok("Conta excluída.", message), ...errors(401, 403, 404, 409, 500) },
    }),
  },
  "/api/vendedor/perfil": {
    get: op("Produtor", "Resumo do produtor logado", { parameters: [emailQuery], responses: { ...ok("Nome, status, telefone, cidade e estado.", ref("ResumoProdutor")), ...errors(401, 403, 500) } }),
  },
  "/api/produtos": {
    get: op("Produtos", "Catálogo oficial", {
      description: "Quem não é administrador só vê produtos ativos. O administrador pode pedir todos com `?todos=1`.",
      security: [],
      parameters: [{ name: "todos", in: "query", schema: str("1") }],
      responses: { ...ok("Lista de produtos.", arr(ref("Produto"))), ...errors(500) },
    }),
    post: op("Produtos", "Cadastra produto (admin)", {
      body: { required: true, content: { "multipart/form-data": { schema: ref("ProdutoInput") }, "application/json": { schema: ref("ProdutoInput") } } },
      responses: { ...res(201, "Produto criado.", ref("Produto")), ...errors(400, 401, 403, 500) },
    }),
    put: op("Produtos", "Edita, ativa ou desativa produto (admin)", {
      description: "Com foto nova, a antiga só é apagada depois de gravar. `status`: ATIVO ou INATIVO (outros valores são ignorados).",
      body: { required: true, content: { "multipart/form-data": { schema: ref("ProdutoInput") }, "application/json": { schema: ref("ProdutoInput") } } },
      responses: { ...ok("Produto atualizado.", ref("Produto")), ...errors(400, 401, 403, 404, 500) },
    }),
    delete: op("Produtos", "Apaga produto (admin)", {
      description: "Sem ligações, apaga de vez. Com produtor ou pedido ligado, só desativa e devolve `desativado: true`.",
      parameters: [{ name: "id", in: "query", required: true, schema: int(1) }],
      responses: { ...ok("Produto apagado ou desativado.", obj({ message: str(), desativado: bool() })), ...errors(400, 401, 403, 404, 500) },
    }),
  },
  "/api/produtor/meus-produtos": {
    get: op("Produtor", "Produtos do catálogo do produtor", {
      description: "Sem `detalhes`: lista de ids. Com `detalhes=1`: [{ cdProduto, preco }].",
      parameters: [emailQuery, { name: "detalhes", in: "query", schema: str("1") }],
      responses: { ...ok("Ids ou detalhes.", { oneOf: [arr(int()), arr(obj({ cdProduto: int(), preco: { ...num(), nullable: true } }))] }), ...errors(401, 403, 404, 500) },
    }),
    post: op("Produtor", "Salva o catálogo do produtor", {
      description: "Sincroniza: o que não vier na lista sai do catálogo dele.",
      body: jsonBody(obj({ produtos: arr(obj({ cdProduto: int(1), preco: num(5.9) }, ["cdProduto"])) })),
      responses: { ...ok("Catálogo salvo.", message), ...errors(400, 401, 403, 404, 500) },
    }),
  },
  "/api/produtor/ofertas": {
    get: op("Produtor", "Mural de pedidos do produtor", {
      description: "Pedidos abertos dos produtos do catálogo dele, o que ele já ofertou e um resumo. Não mostra e-mail de mercado nem de outros produtores.",
      responses: { ...ok("Mural.", ref("Mural")), ...errors(401, 403, 404, 500) },
    }),
    post: op("Produtor", "Garante uma quantidade de um pedido", {
      body: jsonBody(obj({ demandaId: str("c1x..."), quantidade: num(30) }, ["demandaId", "quantidade"])),
      responses: { ...res(201, "Oferta registrada.", message), ...errors(400, 401, 403, 404, 500) },
    }),
  },
  "/api/produtor/sugestao": {
    get: op("Produtor", "Lista sugestões de produto (admin)", { responses: { ...ok("Sugestões.", arr(ref("Sugestao"))), ...errors(401, 403, 500) } }),
    post: op("Produtor", "Sugere um produto novo", {
      description: "Multipart com nome, descrição, preço por kg e foto opcional. O e-mail é o da sessão.",
      body: { required: true, content: { "multipart/form-data": { schema: obj({ nomeProduto: str("Pitaya"), descricao: str(), precoSugerido: str("12,50"), file: { type: "string", format: "binary" } }, ["nomeProduto"]) } } },
      responses: { ...res(201, "Sugestão enviada.", message), ...errors(400, 401, 403, 500) },
    }),
    delete: op("Produtor", "Apaga uma sugestão (admin)", { parameters: [{ name: "id", in: "query", required: true, schema: int(1) }], responses: { ...ok("Apagada.", message), ...errors(400, 401, 403, 404, 500) } }),
  },
  "/api/produtor/balancas": {
    get: op("Balanças", "Balanças do produtor", { description: "Todas as vinculadas e qual está conectada. É o contrato `ScaleState` do app mobile.", responses: { ...ok("Estado das balanças.", ref("EstadoBalancas")), ...errors(401, 403, 500) } }),
    post: op("Balanças", "Vincula uma balança", {
      description: "Balança livre exige o `codigo` da etiqueta (HMAC do MAC). Código errado e balança inexistente respondem igual (404). Já sendo do produtor, só a deixa conectada. 5 erros em 15 min travam.",
      body: jsonBody(obj({ deviceId: str("A4:CF:12:9B:07:E1"), codigo: str("K7M2-Q9XT") }, ["deviceId"])),
      responses: { ...res(201, "Balança vinculada e conectada.", ref("BalancaVinculada")), ...errors(400, 401, 403, 404, 409, 429, 500) },
    }),
  },
  "/api/produtor/balancas/{id}": {
    patch: op("Balanças", "Renomeia (apelido)", { parameters: [idParam], body: jsonBody(obj({ apelido: str("Balança do galpão") }, ["apelido"])), responses: { ...ok("Balança atualizada.", ref("BalancaVinculada")), ...errors(400, 401, 403, 404, 500) } }),
    delete: op("Balanças", "Desvincula", { description: "Libera a balança e apaga o histórico de pesagens dela.", parameters: [idParam], responses: { ...ok("Removida.", message), ...errors(401, 403, 404, 500) } }),
  },
  "/api/produtor/balancas/{id}/conectada": {
    put: op("Balanças", "Escolhe qual balança está em uso", { description: "Só uma fica conectada por produtor (garantido por índice único no banco).", parameters: [idParam], responses: { ...ok("Conectada.", message), ...errors(401, 403, 404, 500) } }),
  },
  "/api/produtor/balancas/{id}/leitura": {
    get: op("Balanças", "Peso ao vivo", {
      description: "O app consulta a cada ~500 ms. `kg` é null quando a balança está offline (sem contato há mais de 15 s). Nunca vem do cache.",
      parameters: [idParam],
      responses: { ...ok("Última leitura.", ref("LeituraAoVivo")), ...errors(401, 403, 404, 500) },
    }),
  },
  "/api/mercado/perfil": {
    get: op("Mercado", "Dados do mercado logado", { parameters: [emailQuery], responses: { ...ok("Perfil do mercado.", ref("PerfilMercado")), ...errors(401, 403, 404, 500) } }),
  },
  "/api/mercado/demandas": {
    get: op("Mercado", "Cotações do mercado logado", { responses: { ...ok("Pedidos com as ofertas recebidas.", arr(ref("Pedido"))), ...errors(401, 403, 500) } }),
    post: op("Mercado", "Dispara uma cotação", {
      description: "Manda só `{ id, qtd }`: nome, unidade e preço de referência o servidor busca no catálogo. 400 se algum produto saiu do catálogo.",
      body: jsonBody(obj({ carrinho: arr(obj({ id: int(1), qtd: int(50) }, ["id", "qtd"])) }, ["carrinho"])),
      responses: { ...res(201, "Pedidos criados.", message), ...errors(400, 401, 403, 404, 500) },
    }),
  },
  "/api/mercado/avaliar": {
    patch: op("Mercado", "Confirma o recebimento e avalia o produtor", { body: jsonBody(obj({ ofertaId: str("c1x..."), nota: int(5) }, ["ofertaId", "nota"])), responses: { ...ok("Entrega confirmada.", message), ...errors(400, 401, 403, 404, 409, 500) } }),
  },
  "/api/mercado/cancelar": {
    patch: op("Mercado", "Cancela um pedido", {
      description: "Vale em até 7 dias úteis após o pedido e só se nada foi entregue. Fora do prazo responde 422 com `prazoExpirado`, `diasPassados` e `prazoMaximo`.",
      body: jsonBody(obj({ demandaId: str("c1x..."), motivo: str("Estoque já abastecido") }, ["demandaId"])),
      responses: { ...ok("Cancelado.", obj({ message: str(), reembolso: str() })), ...errors(400, 401, 403, 404, 422, 500) },
    }),
  },
  "/api/admin/usuarios": {
    get: op("Admin", "Lista produtores, mercados e administradores", { responses: { ...ok("Usuários.", arr(ref("UsuarioAdmin"))), ...errors(401, 403, 500) } }),
    put: op("Admin", "Aprova, rejeita ou suspende", { body: jsonBody(obj({ email: str(), tipo: str("produtor"), novoStatus: str("APROVADO"), motivo: str() }, ["email", "tipo", "novoStatus"])), responses: { ...ok("Status alterado.", message), ...errors(400, 401, 403, 404, 500) } }),
    patch: op("Admin", "Corrige nome, telefone, cidade ou estado", { body: jsonBody(obj({ email: str(), tipo: str("mercado"), nomeFantasia: str(), telefone: str(), cidade: str(), estado: str("SP") }, ["email", "tipo"])), responses: { ...ok("Atualizado.", message), ...errors(400, 401, 403, 404, 500) } }),
    delete: op("Admin", "Exclui uma conta", {
      description: "409 se houver pedidos ou itens ligados: suspenda em vez de excluir.",
      parameters: [{ name: "email", in: "query", required: true, schema: str() }, { name: "tipo", in: "query", required: true, schema: str("produtor") }, { name: "motivo", in: "query", schema: str() }],
      responses: { ...ok("Excluído.", message), ...errors(400, 401, 403, 404, 409, 500) },
    }),
  },
  "/api/admin/novo-admin": {
    post: op("Admin", "Cria outro administrador", { body: jsonBody(obj({ email: str(), senha: str("Raiz@2026!") }, ["email", "senha"])), responses: { ...res(201, "Administrador criado.", message), ...errors(400, 401, 403, 409, 500) } }),
  },
  "/api/admin/promover-sugestao": {
    post: op("Admin", "Transforma uma sugestão em produto", {
      description: "Cria o produto e apaga a sugestão numa transação. Os campos ajustados valem; o que faltar vem da sugestão.",
      body: jsonBody(obj({ idSugestao: int(1), nome: str(), tipo: str("Frutas"), preco: str("12,50"), unidadePadrao: str("Kg") }, ["idSugestao"])),
      responses: { ...res(201, "Produto criado.", message), ...errors(400, 401, 403, 404, 500) },
    }),
  },
  "/api/admin/balancas": {
    get: op("Balanças (admin)", "Lista todas as balanças", { responses: { ...ok("Balanças com código da etiqueta, vínculo e estado online.", arr(ref("BalancaAdmin"))), ...errors(401, 403, 500) } }),
    post: op("Balanças (admin)", "Cadastra uma balança", {
      description: "Devolve o `segredo` UMA vez (o banco guarda só o hash). Grave no firmware do ESP32; para ver outro, gere um novo.",
      body: jsonBody(obj({ deviceId: str("A4:CF:12:9B:07:E1"), nome: str("Balança 01") }, ["deviceId"])),
      responses: { ...res(201, "Balança cadastrada.", obj({ balanca: ref("BalancaAdmin"), segredo: str("rc_...") })), ...errors(400, 401, 403, 409, 500) },
    }),
  },
  "/api/admin/balancas/{id}": {
    patch: op("Balanças (admin)", "Libera a balança do produtor", { parameters: [idParam], body: jsonBody(obj({ liberar: bool(true) }, ["liberar"])), responses: { ...ok("Liberada (histórico apagado).", ref("BalancaAdmin")), ...errors(400, 401, 403, 404, 500) } }),
    delete: op("Balanças (admin)", "Remove a balança", { parameters: [idParam], responses: { ...ok("Removida.", message), ...errors(401, 403, 404, 500) } }),
  },
  "/api/admin/balancas/{id}/segredo": {
    post: op("Balanças (admin)", "Gera um novo segredo", { description: "O segredo anterior deixa de valer na hora.", parameters: [idParam], responses: { ...ok("Novo segredo (mostrado uma vez).", obj({ segredo: str("rc_...") })), ...errors(401, 403, 404, 500) } }),
  },
  "/api/iot/config": {
    get: op("IoT", "Configuração do módulo", {
      description: "Chamado pelo ESP32 ao ligar. Devolve a hora do servidor e os intervalos de envio. Toda falha de autenticação responde o mesmo 401.",
      security: DEVICE,
      parameters: [{ name: "X-Device-Id", in: "header", required: true, schema: str("A4:CF:12:9B:07:E1") }],
      responses: { ...ok("Configuração.", obj({ hora: int(1761600000000), vinculada: bool(), intervaloAtivoMs: int(500), intervaloOciosoMs: int(5000), lote: int(10) })), ...errors(401, 500) },
    }),
  },
  "/api/iot/leituras": {
    post: op("IoT", "Envia leituras de peso", {
      description: "Até 50 leituras por envio (0–500 kg). Só leituras estáveis e que mudaram (≥ 0,005 kg) de balança vinculada entram no histórico (90 dias). Lista vazia vale como “estou vivo”.",
      security: DEVICE,
      parameters: [{ name: "X-Device-Id", in: "header", required: true, schema: str("A4:CF:12:9B:07:E1") }],
      body: jsonBody(obj({ firmware: str("1.0.0"), leituras: arr(obj({ kg: num(12.34), estavel: bool(true), t: int(1761600000000) }, ["kg"])) })),
      responses: { ...ok("Recebido.", obj({ ok: bool(true), hora: int(), vinculada: bool() })), ...errors(400, 401, 500) },
    }),
  },
  "/api/setup-admin": {
    get: op("Utilitários", "Cria o primeiro administrador", {
      description: "Usa ADMIN_SENHA_INICIAL (obrigatória). Só cria se ainda não existir administrador.",
      security: [],
      responses: { ...ok("Administrador criado ou já existente.", message), ...errors(500) },
    }),
  },
};

const status = (values) => str(values[0], { enum: values });

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Raiz Conecta — API",
    version: "2.0.0",
    description:
      "API do site e do app mobile. **Autenticação:** o login devolve um JWT (HS256, 2 h). O app envia `Authorization: Bearer <token>`; o site usa o cookie httpOnly `token`. " +
      "**Erros:** sempre `{ \"error\": \"mensagem\" }`. **Balanças:** o módulo ESP32 usa `X-Device-Id` + `Authorization: Device <segredo>` (ver docs/IOT.md).",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    { name: "Auth", description: "Cadastro, login e sessão" },
    { name: "Perfil", description: "Dados e segurança da própria conta" },
    { name: "Produtor", description: "Catálogo, mural, ofertas e sugestões do produtor" },
    { name: "Mercado", description: "Cotações, avaliação e cancelamento" },
    { name: "Produtos", description: "Catálogo oficial" },
    { name: "Balanças", description: "Balanças IoT do produtor" },
    { name: "Balanças (admin)", description: "Cadastro e manutenção das balanças" },
    { name: "IoT", description: "Chamadas feitas pelo módulo da balança (ESP32)" },
    { name: "Admin", description: "Gestão de usuários e catálogo" },
    { name: "Utilitários", description: "Setup inicial" },
  ],
  paths,
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Token do login (app mobile)." },
      CookieAuth: { type: "apiKey", in: "cookie", name: "token", description: "Cookie httpOnly gravado pelo login (site)." },
      DeviceAuth: { type: "apiKey", in: "header", name: "Authorization", description: "`Device <segredo>` — o segredo mostrado uma vez ao cadastrar a balança." },
    },
    schemas: {
      Erro: obj({ error: str("Mensagem pronta para mostrar à pessoa") }, ["error"]),
      Mensagem: obj({ message: str("Operação concluída.") }),
      CadastroInput: obj(
        {
          tipoUsuario: status(["produtor", "mercado"]), nome: str("Fazenda São João"), email: str("maria@exemplo.com"), senha: str("Raiz@2026!"), telefone: str("(14) 99999-9999"),
          tipoDoc: status(["CPF", "CNPJ"]), documento: str("12345678901"), cep: str("18110000"), rua: str(), numero: str("12"), bairro: str(), cidade: str("Votorantim"), estado: str("SP"),
          file: { type: "string", format: "binary", description: "Foto ou PDF do documento (JPG, PNG, WebP, HEIC ou PDF, até 5 MB)." },
        },
        ["tipoUsuario", "nome", "email", "senha", "tipoDoc", "documento", "cep", "rua", "numero", "cidade", "estado", "file"],
      ),
      LoginInput: obj({ email: str("maria@exemplo.com"), senha: str() }, ["email", "senha"]),
      LoginResponse: obj({ message: str(), token: str("eyJhbGciOi..."), user: obj({ email: str(), tipoUser: status(["produtor", "mercado", "admin"]), nome: str(), status: status(["APROVADO", "EM_ANALISE"]) }) }),
      SessaoAtual: obj({ email: str(), role: status(["produtor", "mercado", "admin"]), nome: str(), status: status(["APROVADO", "EM_ANALISE", "REJEITADO", "SUSPENSO"]) }),
      PerfilCompleto: obj({ email: str(), tipoUser: str("produtor"), nomeFantasia: str(), telefone: str(), tipoDoc: str("CPF"), documento: str(), cep: str("18110000"), rua: str(), numero: str(), bairro: str(), cidade: str(), estado: str("SP"), status: str("APROVADO") }),
      PerfilInput: obj({ nomeFantasia: str(), telefone: str("(14) 99999-9999"), cep: str("18110-000"), rua: str(), numero: str(), bairro: str(), cidade: str(), estado: str("SP"), senhaAtual: str(), novaSenha: str("Raiz@2026!") }),
      ResumoProdutor: obj({ email: str(), nomeFantasia: str(), status: str(), telefone: str(), cidade: str(), estado: str() }),
      PerfilMercado: obj({ email: str(), nomeFantasia: str(), status: str(), telefone: str(), cidade: str(), estado: str(), rua: str(), numero: str(), bairro: str(), cep: str() }),
      Produto: obj({ cdProduto: int(1), nome: str("Maçã Fuji"), tipo: status(["Frutas", "Verduras", "Legumes", "Grãos", "Outros"]), preco: num(5.9), unidadePadrao: status(["Kg", "Unidade", "Maço", "Caixa"]), descricao: str(), imagemUrl: str(), status: status(["ATIVO", "INATIVO"]) }),
      ProdutoInput: obj({ id: int(1), nome: str("Maçã Fuji"), tipo: str("Frutas"), preco: str("5,90"), unidadePadrao: str("Kg"), descricao: str(), status: status(["ATIVO", "INATIVO"]), file: { type: "string", format: "binary" } }, ["nome", "preco"]),
      Sugestao: obj({ id: int(), emailProdutor: str(), nomeProduto: str(), descricao: str(), imagemUrl: str(), precoSugerido: num(), criadoEm: str("2026-10-27T12:00:00.000Z") }),
      Pedido: obj({
        id: str("c1x..."), produto: str("Tomate"), quantidade: num(100), unidade: str("Kg"), precoMedio: num(6.5), status: status(["ABERTA", "CONCLUIDA", "CANCELADA"]), criadoEm: str("2026-10-27T12:00:00.000Z"),
        garantido: num(60), percentual: int(60),
        ofertas: arr(obj({ id: str(), quantidade: num(), status: str(), statusEntrega: status(["PENDENTE", "ENTREGUE"]), nota: { type: "integer", nullable: true }, produtor: str("Sítio Bom") })),
      }),
      Mural: obj({ mural: arr(ref("MuralItem")), minhas: arr(ref("MuralItem")), resumo: obj({ paraResponder: int(), ofertasFeitas: int(), quilosGarantidos: num(), receitaEstimada: num() }), produtosNoCatalogo: int() }),
      MuralItem: obj({ id: str(), produto: str(), quantidade: num(), unidade: str(), precoMedio: num(), status: status(["ABERTA", "CONCLUIDA"]), atendido: num(), faltante: num(), percentual: int(), criadoEm: str(), minhaQuantidade: { type: "number", nullable: true } }),
      UsuarioAdmin: obj({ email: str(), nomeFantasia: str(), status: str(), tipo: status(["produtor", "mercado", "admin"]), telefone: str(), cidade: str(), estado: str(), criadoEm: str() }),
      BalancaVinculada: obj({ deviceId: str("A4:CF:12:9B:07:E1"), deviceName: str("Balança 01"), nickname: { type: "string", nullable: true }, key: str("RC-1a2b3c4d5e6f7a8b9c0d"), linkedAt: str("2026-10-27T12:00:00.000Z") }),
      EstadoBalancas: obj({ scales: arr(ref("BalancaVinculada")), activeDeviceId: { type: "string", nullable: true } }),
      LeituraAoVivo: obj({ online: bool(), kg: { type: "number", nullable: true }, estavel: bool(), em: { type: "integer", nullable: true }, agora: int() }),
      BalancaAdmin: obj({
        deviceId: str(), nome: str(), codigo: str("K7M2-Q9XT"), emailProdutor: { type: "string", nullable: true }, apelido: { type: "string", nullable: true }, conectada: bool(), online: bool(),
        firmware: { type: "string", nullable: true }, ultimoContato: { type: "string", nullable: true }, ultimoKg: { type: "number", nullable: true }, vinculadaEm: { type: "string", nullable: true }, criadoEm: str(),
      }),
    },
  },
};

writeFileSync(new URL("../src/swagger.json", import.meta.url), JSON.stringify(spec, null, 2) + "\n");
console.log(`swagger.json: ${Object.keys(paths).length} caminhos`);
