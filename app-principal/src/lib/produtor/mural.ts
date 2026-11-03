import { normalizeText } from "@/lib/text/normalize";

// O que o banco guarda de uma demanda (pedido de um mercado) e das ofertas que produtores já fizeram para ela.
export interface DemandaRow {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number | null;
  status: string;
  criadoEm: Date | string;
  ofertas: { quantidade: number; emailProdutor: string }[];
}

// O que o produtor recebe: sem e-mail do mercado nem de outros produtores.
export interface MuralItem {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  status: "ABERTA" | "CONCLUIDA";
  // Quanto já foi garantido (por todos os produtores) e quanto falta.
  atendido: number;
  faltante: number;
  percentual: number;
  criadoEm: string;
  // Quanto este produtor garantiu (null = ainda não ofertou).
  minhaQuantidade: number | null;
}

export interface MuralResumo {
  paraResponder: number;
  ofertasFeitas: number;
  // Soma do que o produtor garantiu, em kg, e a receita estimada (quantidade × preço médio do pedido).
  quilosGarantidos: number;
  receitaEstimada: number;
}

export interface Mural {
  mural: MuralItem[];
  minhas: MuralItem[];
  resumo: MuralResumo;
}

export function toMuralItem(demanda: DemandaRow, email: string): MuralItem {
  const atendido = demanda.ofertas.reduce((total, oferta) => total + oferta.quantidade, 0);
  const minha = demanda.ofertas.find((oferta) => sameEmail(oferta.emailProdutor, email));
  return {
    id: demanda.id,
    produto: demanda.produto,
    quantidade: demanda.quantidade,
    unidade: demanda.unidade,
    precoMedio: demanda.precoMedio ?? 0,
    status: demanda.status === "CONCLUIDA" ? "CONCLUIDA" : "ABERTA",
    atendido,
    faltante: Math.max(demanda.quantidade - atendido, 0),
    percentual: demanda.quantidade > 0 ? Math.min(Math.round((atendido / demanda.quantidade) * 100), 100) : 0,
    criadoEm: new Date(demanda.criadoEm).toISOString(),
    minhaQuantidade: minha ? minha.quantidade : null,
  };
}

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Separa o que o produtor pode responder agora (mural) do que ele já ofertou (minhas):
// o mural só tem pedidos abertos, de produtos do catálogo dele, que ele ainda não ofertou.
export function buildMural(demandas: DemandaRow[], email: string, catalogProductNames: string[]): Mural {
  const catalog = new Set(catalogProductNames.map(normalizeText));
  const items = demandas.map((demanda) => toMuralItem(demanda, email));

  const mural = items.filter(
    (item) => item.status === "ABERTA" && item.minhaQuantidade === null && catalog.has(normalizeText(item.produto)),
  );
  const minhas = items.filter((item) => item.minhaQuantidade !== null);

  return { mural, minhas, resumo: summarize(mural, minhas) };
}

function summarize(mural: MuralItem[], minhas: MuralItem[]): MuralResumo {
  return {
    paraResponder: mural.length,
    ofertasFeitas: minhas.length,
    quilosGarantidos: minhas.reduce((total, item) => total + (item.minhaQuantidade ?? 0), 0),
    receitaEstimada: round2(minhas.reduce((total, item) => total + (item.minhaQuantidade ?? 0) * item.precoMedio, 0)),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Valida a quantidade que o produtor quer ofertar para uma demanda. `null` = pode ofertar.
export function validateOffer(
  demanda: Pick<DemandaRow, "quantidade" | "status" | "unidade" | "ofertas">,
  quantidade: unknown,
  email: string,
): string | null {
  const qty = Number(quantidade);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) return "Informe uma quantidade inteira maior que zero.";
  if (demanda.status === "CONCLUIDA") return "Este pedido já foi totalmente atendido.";
  if (demanda.ofertas.some((oferta) => sameEmail(oferta.emailProdutor, email))) {
    return "Você já fez uma oferta para este pedido.";
  }
  const faltante = demanda.quantidade - demanda.ofertas.reduce((total, oferta) => total + oferta.quantidade, 0);
  if (qty > faltante) return `O mercado só precisa de mais ${faltante} ${demanda.unidade} deste item.`;
  return null;
}
