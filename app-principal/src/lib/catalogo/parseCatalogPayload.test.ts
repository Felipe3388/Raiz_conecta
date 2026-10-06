import { describe, expect, it } from "vitest";
import { parseCatalogPayload } from "./parseCatalogPayload";

describe("parseCatalogPayload", () => {
  it("aceita produtos com preço sugerido opcional", () => {
    const result = parseCatalogPayload({
      produtos: [{ cdProduto: 1, preco: 12.5 }, { cdProduto: 4 }],
    });

    expect(result).toEqual({
      ok: true,
      items: [{ cdProduto: 1, preco: 12.5 }, { cdProduto: 4 }],
    });
  });

  it("mantém compatibilidade com o formato antigo produtosIds", () => {
    expect(parseCatalogPayload({ produtosIds: [1, 4] })).toEqual({
      ok: true,
      items: [{ cdProduto: 1 }, { cdProduto: 4 }],
    });
  });

  it("aceita lista vazia (produtor limpou o catálogo)", () => {
    expect(parseCatalogPayload({ produtos: [] })).toEqual({ ok: true, items: [] });
    expect(parseCatalogPayload({ produtosIds: [] })).toEqual({ ok: true, items: [] });
  });

  it("recusa quando nenhuma lista é informada", () => {
    expect(parseCatalogPayload({ email: "a@b.com" })).toEqual({
      ok: false,
      error: "Informe a lista de produtos.",
    });
  });

  it("recusa quando as duas listas são enviadas juntas", () => {
    expect(parseCatalogPayload({ produtos: [], produtosIds: [] })).toEqual({
      ok: false,
      error: "Envie apenas produtos ou produtosIds.",
    });
  });

  it.each([null, undefined, "texto", 42, [1, 2]])("recusa corpo inválido (%p)", (body) => {
    expect(parseCatalogPayload(body)).toMatchObject({ ok: false });
  });

  it.each([0, -1, 1.5, "1", null])("recusa cdProduto inválido (%p)", (cdProduto) => {
    expect(parseCatalogPayload({ produtos: [{ cdProduto }] })).toEqual({
      ok: false,
      error: "Código de produto inválido.",
    });
    expect(parseCatalogPayload({ produtosIds: [cdProduto] })).toEqual({
      ok: false,
      error: "Código de produto inválido.",
    });
  });

  it.each([0, -5, "12", null])("recusa preço inválido (%p)", (preco) => {
    expect(parseCatalogPayload({ produtos: [{ cdProduto: 3, preco }] })).toEqual({
      ok: false,
      error: "Preço inválido para o produto 3.",
    });
  });

  it("arredonda o preço para 2 casas decimais", () => {
    const result = parseCatalogPayload({ produtos: [{ cdProduto: 1, preco: 10.456 }] });

    expect(result).toEqual({ ok: true, items: [{ cdProduto: 1, preco: 10.46 }] });
  });

  it("junta produtos repetidos mantendo o último preço informado", () => {
    const result = parseCatalogPayload({
      produtos: [
        { cdProduto: 1, preco: 10 },
        { cdProduto: 2 },
        { cdProduto: 1, preco: 20 },
      ],
    });

    expect(result).toEqual({
      ok: true,
      items: [{ cdProduto: 1, preco: 20 }, { cdProduto: 2 }],
    });
  });

  it("não perde o preço quando o produto repetido vem sem preço depois", () => {
    const result = parseCatalogPayload({
      produtos: [{ cdProduto: 1, preco: 10 }, { cdProduto: 1 }],
    });

    expect(result).toEqual({ ok: true, items: [{ cdProduto: 1, preco: 10 }] });
  });
});
