"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/http/client";
import { buildPayload, firstPriceError, fromSaved, isDirty, setPrice, toggle, type SavedItem, type Selection } from "@/lib/produtor/catalogSelection";
import { normalizeText } from "@/lib/text/normalize";

export interface CatalogItem {
  cdProduto: number;
  nome: string | null;
  tipo: string | null;
  imagemUrl: string | null;
  status?: string | null;
}

export type CatalogView = "todos" | "meus";

// Controller do Meu Catálogo: carrega os produtos ativos e os do produtor, marca e desmarca, guarda o preço por kg e
// salva tudo de uma vez. As regras ficam em lib/produtor/catalogSelection.
export function useProducerCatalog(onSaved: () => Promise<void> | void) {
  const [products, setProducts] = useState<CatalogItem[] | null>(null);
  const [saved, setSaved] = useState<Selection>(new Map());
  const [selection, setSelection] = useState<Selection>(new Map());
  const [search, setSearch] = useState("");
  const [view, setView] = useState<CatalogView>("todos");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [all, mine] = await Promise.all([api<CatalogItem[]>("/api/produtos"), api<SavedItem[]>("/api/produtor/meus-produtos?detalhes=1")]);
    if (!all.ok || !mine.ok || !Array.isArray(all.data) || !Array.isArray(mine.data)) return void setError(all.error || mine.error);
    setProducts(all.data.filter((product) => !product.status || product.status === "ATIVO"));
    const initial = fromSaved(mine.data);
    setSaved(initial);
    setSelection(new Map(initial));
    setError("");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da tela: o estado é preenchido quando a resposta chega
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = normalizeText(search);
    return (products ?? [])
      .filter((product) => view === "todos" || selection.has(product.cdProduto))
      .filter((product) => !term || normalizeText(product.nome ?? "").includes(term));
  }, [products, search, view, selection]);

  async function save() {
    const problem = firstPriceError(selection);
    if (problem) return void toast.warning(problem);
    setSaving(true);
    const result = await api("/api/produtor/meus-produtos", { method: "POST", json: buildPayload(selection) });
    setSaving(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Catálogo salvo", { description: "As Ofertas já mostram os pedidos dos produtos marcados." });
    setSaved(new Map(selection));
    await onSaved();
  }

  return {
    products,
    visible,
    error,
    reload: load,
    search,
    setSearch,
    view,
    setView,
    selection,
    count: selection.size,
    dirty: isDirty(saved, selection),
    saving,
    toggle: (id: number) => setSelection((current) => toggle(current, id)),
    setPrice: (id: number, text: string) => setSelection((current) => setPrice(current, id, text)),
    discard: () => setSelection(new Map(saved)),
    save,
  };
}
