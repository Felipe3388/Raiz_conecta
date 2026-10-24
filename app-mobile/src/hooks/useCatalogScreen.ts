import { useMemo, useState } from "react";
import {
  applyCatalogView,
  catalogCounts,
  DEFAULT_CATALOG_VIEW,
  type CatalogFilter,
  type CatalogLayout,
  type CatalogSort,
} from "@/lib/produtor/catalogView";
import type { CatalogProduct } from "@/types/produtor";
import { usePriceEditing } from "./usePriceEditing";
import { useProdutorData } from "./useProdutorData";
import { useToast } from "./useToast";
import { useUndo } from "./useUndo";

// Controller do Meu Catálogo: busca, filtros, ordem, forma de ver, marcar produtos, preço de cada um e salvar.
export function useCatalogScreen() {
  const data = useProdutorData();
  const toast = useToast();
  const undo = useUndo();
  const prices = usePriceEditing();
  const [query, setQuery] = useState(DEFAULT_CATALOG_VIEW.query);
  const [filter, setFilter] = useState<CatalogFilter>(DEFAULT_CATALOG_VIEW.filter);
  const [sort, setSort] = useState<CatalogSort>(DEFAULT_CATALOG_VIEW.sort);
  const [layout, setLayout] = useState<CatalogLayout>("grid");
  const [isSaving, setIsSaving] = useState(false);

  const products = useMemo(
    () => applyCatalogView(data.products, data.selectedIds, { query, filter, sort }),
    [data.products, data.selectedIds, query, filter, sort],
  );
  const counts = useMemo(
    () => catalogCounts(data.products, data.selectedIds, query),
    [data.products, data.selectedIds, query],
  );

  async function save() {
    setIsSaving(true);
    try {
      const previous = await data.saveSelection();
      undo.announce({
        title: "Catálogo salvo!",
        description: "Os pedidos dos seus produtos chegam em Ofertas.",
        label: "Catálogo salvo",
        revert: () => data.restoreSavedIds(previous),
      });
    } catch {
      toast.show("error", "Erro ao salvar catálogo.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    status: data.status,
    products,
    counts,
    selectedIds: data.selectedIds,
    selectedCount: data.selectedIds.length,
    resultCount: products.length,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    layout,
    setLayout,
    toggleProduct: data.toggleProduct,
    // Preço que o produtor pede por um produto, e a folha para editá-lo.
    priceOf: (product: CatalogProduct) => prices.priceOf(product.nome),
    editPrice: (product: CatalogProduct) => prices.edit({ produto: product.nome }),
    priceEditor: prices,
    hasUnsavedSelection: data.hasUnsavedSelection,
    isSaving,
    save,
    reload: data.reload,
  };
}
