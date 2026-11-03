// Regras do cadastro de produtos do catálogo oficial. Funções puras (testadas à parte).

export const CATEGORIAS = ["Frutas", "Verduras", "Legumes", "Grãos", "Outros"] as const;
export const UNIDADES = ["Kg", "Unidade", "Maço", "Caixa"] as const;

export interface ProdutoInput {
  nome: string;
  tipo: string;
  preco: number;
  unidadePadrao: string;
  descricao: string | null;
}

// "5,90" e "5.90" valem 5,9; vazio e texto viram NaN.
export function parsePreco(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.trim().replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
}

// Confere e arruma os campos que vieram da tela. Devolve o produto pronto ou a mensagem do que está errado.
export function parseProduto(raw: Record<string, unknown>): { ok: true; produto: ProdutoInput } | { ok: false; error: string } {
  const nome = typeof raw.nome === "string" ? raw.nome.trim() : "";
  const tipo = typeof raw.tipo === "string" && raw.tipo.trim() ? raw.tipo.trim() : "Outros";
  const unidadePadrao = typeof raw.unidadePadrao === "string" && raw.unidadePadrao.trim() ? raw.unidadePadrao.trim() : "Kg";
  const preco = parsePreco(raw.preco);
  const descricao = typeof raw.descricao === "string" && raw.descricao.trim() ? raw.descricao.trim().slice(0, 500) : null;

  if (nome.length < 2) return { ok: false, error: "Informe o nome do produto." };
  if (nome.length > 80) return { ok: false, error: "O nome do produto é longo demais (máximo 80 letras)." };
  if (!(CATEGORIAS as readonly string[]).includes(tipo)) return { ok: false, error: "Categoria inválida." };
  if (!(UNIDADES as readonly string[]).includes(unidadePadrao)) return { ok: false, error: "Unidade inválida." };
  if (!Number.isFinite(preco) || preco <= 0 || preco > 100_000) return { ok: false, error: "Informe um preço maior que zero." };

  return { ok: true, produto: { nome, tipo, preco: Math.round(preco * 100) / 100, unidadePadrao, descricao } };
}
