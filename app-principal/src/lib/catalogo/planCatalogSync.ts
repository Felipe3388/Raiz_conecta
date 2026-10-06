import type { CatalogItem, ExistingLink, SyncPlan } from "./types";

// Compara o catálogo gravado com o desejado e diz o que criar, atualizar e remover.
// Quem já estava no catálogo e veio sem preço mantém o preço que tinha.
export function planCatalogSync(
  existing: ExistingLink[],
  desired: CatalogItem[],
  now: Date,
): SyncPlan {
  const wanted = new Set(desired.map((item) => item.cdProduto));
  const kept = new Map<number, ExistingLink>();
  const deleteIds: number[] = [];

  for (const link of [...existing].sort((a, b) => a.idRegistro - b.idRegistro)) {
    const { cdProduto } = link;
    const isKeepable = cdProduto !== null && wanted.has(cdProduto) && !kept.has(cdProduto);

    if (isKeepable) kept.set(cdProduto, link);
    else deleteIds.push(link.idRegistro);
  }

  const plan: SyncPlan = { deleteIds, create: [], update: [] };

  for (const { cdProduto, preco } of desired) {
    const current = kept.get(cdProduto);

    if (!current) {
      plan.create.push(preco === undefined ? { cdProduto } : { cdProduto, preco, dtAtzPreco: now });
    } else if (preco !== undefined && preco !== current.preco) {
      plan.update.push({ idRegistro: current.idRegistro, preco, dtAtzPreco: now });
    }
  }

  return plan;
}
