import type { SuggestionRecord } from "@/types/produtor";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

// Sugestões de exemplo, uma em cada situação, para a tela "Minhas sugestões" ter o que mostrar.
export function seedSuggestions(): SuggestionRecord[] {
  return [
    { id: "s-cacau", nomeProduto: "Cacau", descricao: "Cacau orgânico, colhido na safra.", precoSugerido: 28, status: "EM_ANALISE", criadoEm: daysAgo(2) },
    { id: "s-jabuticaba", nomeProduto: "Jabuticaba", descricao: "", precoSugerido: 12, status: "APROVADA", criadoEm: daysAgo(20) },
    { id: "s-chicoria", nomeProduto: "Chicória", descricao: "Folha fresca, colhida na hora.", precoSugerido: null, status: "RECUSADA", criadoEm: daysAgo(35), motivo: "já existe no catálogo com o nome Escarola." },
  ];
}
