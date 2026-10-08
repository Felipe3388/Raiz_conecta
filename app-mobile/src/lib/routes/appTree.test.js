// Ao extrair uma versão nova por cima da pasta antiga, telas apagadas continuam lá e disputam o mesmo
// endereço com as novas (o app abre sem barra de abas e sem o ícone da conta). Este teste acusa isso.
// Fica em JavaScript para não precisar dos tipos do Node no projeto.
const fs = require("fs");
const path = require("path");
const { duplicateRoutes } = require("./routeFiles");

function listFiles(root, base = "") {
  return fs.readdirSync(path.join(root, base), { withFileTypes: true }).flatMap((entry) => {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(root, relative) : [relative];
  });
}

describe("pasta src/app", () => {
  it("não tem duas telas para o mesmo endereço (apague o arquivo que sobrou da versão antiga)", () => {
    const duplicates = duplicateRoutes(listFiles(path.join(__dirname, "../../app")));
    expect(duplicates).toEqual([]);
  });
});
