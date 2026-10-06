// Produto que o produtor quer ter no catálogo, com preço sugerido opcional.
export interface CatalogItem {
  cdProduto: number;
  preco?: number;
}

// Vínculo já gravado em Prod_Vendedor_Possui.
export interface ExistingLink {
  idRegistro: number;
  cdProduto: number | null;
  preco: number | null;
}

export interface SyncPlan {
  deleteIds: number[];
  create: { cdProduto: number; preco?: number; dtAtzPreco?: Date }[];
  update: { idRegistro: number; preco: number; dtAtzPreco: Date }[];
}
