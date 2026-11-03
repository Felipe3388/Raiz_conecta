import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import spec from "./swagger.json";

const API_DIR = join(__dirname, "app", "api");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return name === "route.ts" ? [full] : [];
  });
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// Toda rota de src/app/api tem de estar na documentação (npm run docs:api regenera o arquivo).
describe("swagger.json", () => {
  const routes = routeFiles(API_DIR).map((file) => {
    const path = "/api/" + relative(API_DIR, join(file, "..")).split(sep).join("/").replace(/\[(\w+)\]/g, "{$1}");
    const source = readFileSync(file, "utf8");
    const methods = METHODS.filter((method) => new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source));
    return { path, methods };
  });

  it("encontra as rotas", () => expect(routes.length).toBeGreaterThan(25));

  it.each(routes)("documenta $path ($methods)", ({ path, methods }) => {
    const documented = (spec.paths as Record<string, Record<string, unknown>>)[path];
    expect(documented, `falta ${path} no swagger`).toBeDefined();
    for (const method of methods) expect(documented, `falta ${method} ${path}`).toHaveProperty(method.toLowerCase());
  });

  it("não documenta rota que não existe mais", () => {
    const real = new Set(routes.map((route) => route.path));
    for (const path of Object.keys(spec.paths)) expect(real.has(path), `${path} está no swagger mas não existe`).toBe(true);
  });

  it("toda referência $ref aponta para um schema existente", () => {
    const text = JSON.stringify(spec);
    const schemas = spec.components.schemas as Record<string, unknown>;
    for (const [, name] of text.matchAll(/#\/components\/schemas\/(\w+)/g)) expect(schemas[name], `schema ${name}`).toBeDefined();
  });
});
