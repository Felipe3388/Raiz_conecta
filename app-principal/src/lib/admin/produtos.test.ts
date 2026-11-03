import { describe, expect, it } from "vitest";
import { parsePreco, parseProduto } from "./produtos";

describe("parsePreco", () => {
  it("aceita vírgula, ponto, milhar e número", () => {
    expect(parsePreco("5,90")).toBe(5.9);
    expect(parsePreco("5.90")).toBe(5.9);
    expect(parsePreco("1.234,50")).toBe(1234.5);
    expect(parsePreco(7)).toBe(7);
  });
  it("devolve NaN para vazio e lixo", () => {
    expect(parsePreco("")).toBeNaN();
    expect(parsePreco("abc")).toBeNaN();
    expect(parsePreco(undefined)).toBeNaN();
  });
});

describe("parseProduto", () => {
  const ok = { nome: " Maçã Fuji ", tipo: "Frutas", preco: "5,9", unidadePadrao: "Kg", descricao: " crocante " };

  it("arruma e aceita um produto válido", () => {
    expect(parseProduto(ok)).toEqual({ ok: true, produto: { nome: "Maçã Fuji", tipo: "Frutas", preco: 5.9, unidadePadrao: "Kg", descricao: "crocante" } });
  });
  it("usa Outros e Kg quando categoria e unidade não vêm", () => {
    const result = parseProduto({ nome: "Abóbora", preco: 3 });
    expect(result).toMatchObject({ ok: true, produto: { tipo: "Outros", unidadePadrao: "Kg", descricao: null } });
  });
  it.each([
    [{ ...ok, nome: "A" }, "Informe o nome do produto."],
    [{ ...ok, tipo: "Carros" }, "Categoria inválida."],
    [{ ...ok, unidadePadrao: "Tonelada" }, "Unidade inválida."],
    [{ ...ok, preco: "0" }, "Informe um preço maior que zero."],
    [{ ...ok, preco: "" }, "Informe um preço maior que zero."],
  ])("recusa %j", (input, error) => {
    expect(parseProduto(input)).toEqual({ ok: false, error });
  });
});
