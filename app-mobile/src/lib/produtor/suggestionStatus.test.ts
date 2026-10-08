import type { SuggestionRecord } from "@/types/produtor";
import { newestFirst, suggestionStatusInfo } from "./suggestionStatus";

describe("suggestionStatusInfo", () => {
  it("em análise: aviso de espera", () => {
    expect(suggestionStatusInfo("EM_ANALISE")).toMatchObject({ label: "Em análise", variant: "warning" });
  });

  it("aprovada: já está no catálogo", () => {
    const info = suggestionStatusInfo("APROVADA");
    expect(info).toMatchObject({ label: "Aprovada", variant: "success" });
    expect(info.help).toMatch(/catálogo/i);
  });

  it("recusada: explica o motivo quando houver", () => {
    expect(suggestionStatusInfo("RECUSADA", "Produto já existe")).toMatchObject({ label: "Recusada", variant: "danger" });
    expect(suggestionStatusInfo("RECUSADA", "Produto já existe").help).toContain("Produto já existe");
  });

  it("recusada sem motivo ainda orienta a pessoa", () => {
    expect(suggestionStatusInfo("RECUSADA").help.length).toBeGreaterThan(10);
  });
});

describe("newestFirst", () => {
  const make = (id: string, criadoEm: string): SuggestionRecord => ({
    id, nomeProduto: id, descricao: "", precoSugerido: null, status: "EM_ANALISE", criadoEm,
  });

  it("coloca as mais novas primeiro sem alterar a lista original", () => {
    const list = [make("a", "2026-10-01T00:00:00Z"), make("b", "2026-10-03T00:00:00Z"), make("c", "2026-10-02T00:00:00Z")];
    expect(newestFirst(list).map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(list.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});
