// Trava as regras de camadas do ARQUITETURA.md: quem pode importar quem. Sem isso elas só existem no papel e
// uma regra de negócio acaba dentro de uma tela. Fica em JavaScript para não precisar dos tipos do Node no projeto.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../..");

// Pastas de `lib` que guardam regras de negócio (funções puras). As outras (`http`, `storage`, `settings`, `media`,
// `navigation`) são infraestrutura e falam com o celular de propósito.
const DOMAIN_LIB = "assistant|auth|delivery|format|pricing|produtor|registration|routes|text|undo|validation";

// Cada regra diz onde vale (`applies`), o que não pode ser importado (`forbidden`) e por quê.
const RULES = [
  {
    why: "regras em lib/ são puras: sem React, sem biblioteca do celular, sem tela, hook ou service",
    applies: (file) => new RegExp(`^lib/(${DOMAIN_LIB})/`).test(file),
    forbidden: [/^react$/, /^react-native/, /^expo/, /^@expo\//, /^@\/(components|hooks|app|services|mocks)/],
  },
  {
    why: "types/ só descreve dados",
    applies: (file) => file.startsWith("types/"),
    forbidden: [/^@\/(components|hooks|app|services|lib|content|mocks)/],
  },
  {
    why: "services/ não conhecem tela nem hook",
    applies: (file) => file.startsWith("services/"),
    forbidden: [/^react$/, /^@\/(components|hooks|app)/],
  },
  {
    why: "content/ é só texto",
    applies: (file) => file.startsWith("content/"),
    forbidden: [/^react/, /^@\/(components|hooks|app|services|mocks)/],
  },
  {
    why: "telas e componentes falam com hooks; do service só os tipos",
    applies: (file) => file.startsWith("components/") || file.startsWith("app/"),
    forbidden: [/^@\/services/],
    allowTypeOnly: true,
  },
  {
    why: "componentes e hooks não importam telas",
    applies: (file) => file.startsWith("components/") || file.startsWith("hooks/"),
    forbidden: [/^@\/app/],
  },
];

function listSources(base = "") {
  return fs.readdirSync(path.join(SRC, base), { withFileTypes: true }).flatMap((entry) => {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return listSources(relative);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [relative] : [];
  });
}

// Tudo o que o arquivo importa (ou reexporta), dizendo se é só tipo.
function importsOf(file) {
  const text = fs.readFileSync(path.join(SRC, file), "utf8");
  const found = text.matchAll(/^(?:import|export)\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gms);
  return [...found].map((match) => ({ typeOnly: Boolean(match[1]), spec: match[2] }));
}

function violationsOf(rule) {
  return listSources()
    .filter(rule.applies)
    .flatMap((file) =>
      importsOf(file)
        .filter((imp) => !(rule.allowTypeOnly && imp.typeOnly))
        .filter((imp) => rule.forbidden.some((pattern) => pattern.test(imp.spec)))
        .map((imp) => `${file} importa ${imp.spec}`),
    );
}

describe("camadas do app", () => {
  it("encontra os arquivos (o teste não passa vazio)", () => {
    expect(listSources().length).toBeGreaterThan(100);
  });

  it.each(RULES.map((rule) => [rule.why, rule]))("%s", (_why, rule) => {
    expect(violationsOf(rule)).toEqual([]);
  });
});
