import { useMemo, useState } from "react";
import {
  applyCatalogView,
  catalogCounts,
  DEFAULT_CATALOG_VIEW,
  type CatalogFilter,
  type CatalogLayout,
  type CatalogSort,
} from "@/lib/produtor/catalogView";
import { useProdutorData } from "./useProdutorData";
import { useToast } from "./useToast";

// Controller do Meu Catálogo: busca, filtros, ordem, forma de ver, marcar produtos e salvar.
export function useCatalogScreen() {
  const data = useProdutorData();
  const toast = useToast();
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
      await data.saveSelection();
      toast.show("success", "Catálogo salvo!", "O Mural de Oportunidades foi atualizado.");
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
    hasUnsavedSelection: data.hasUnsavedSelection,
    isSaving,
    save,
    reload: data.reload,
  };
}
