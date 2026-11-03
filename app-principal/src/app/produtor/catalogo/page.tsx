"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, MessageSquarePlus, Save, Sprout } from "lucide-react";
import { toast } from "sonner";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { PageHeading } from "@/components/ui/PageHeading";
import { SuggestionModal } from "@/components/produtor/SuggestionModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  buildPayload,
  firstPriceError,
  fromSaved,
  isDirty,
  priceError,
  setPrice,
  toggle,
  type SavedItem,
  type Selection,
} from "@/lib/produtor/catalogSelection";
import { normalizeText } from "@/lib/text/normalize";

interface Produto {
  cdProduto: number;
  nome: string | null;
  tipo: string | null;
  imagemUrl: string | null;
  status?: string | null;
}

// Catálogo: o produtor marca o que vende e, se quiser, o preço por kg. O Mural de Ofertas só mostra pedidos desses produtos.
export default function CatalogoPage() {
  const { reloadMural } = useProdutor();
  const [products, setProducts] = useState<Produto[] | null>(null);
  const [saved, setSaved] = useState<Selection>(new Map());
  const [selection, setSelection] = useState<Selection>(new Map());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [resProducts, resMine] = await Promise.all([fetch("/api/produtos"), fetch("/api/produtor/meus-produtos?detalhes=1")]);
      if (!resProducts.ok || !resMine.ok) throw new Error("falha");
      const list: Produto[] = await resProducts.json();
      const mine: SavedItem[] = await resMine.json();
      setProducts(list.filter((product) => !product.status || product.status === "ATIVO"));
      const initial = fromSaved(mine);
      setSaved(initial);
      setSelection(new Map(initial));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = normalizeText(search);
    return (products ?? []).filter((product) => !term || normalizeText(product.nome ?? "").includes(term));
  }, [products, search]);

  const dirty = isDirty(saved, selection);

  async function save() {
    const problem = firstPriceError(selection);
    if (problem) return toast.warning(problem);

    setSaving(true);
    try {
      const res = await fetch("/api/produtor/meus-produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(selection)),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success("Catálogo salvo!", { description: "As Ofertas foram atualizadas." });
      setSaved(new Map(selection));
      await reloadMural();
    } catch {
      toast.error("Não foi possível salvar o catálogo.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <EmptyState
        icon={<Sprout size={56} className="text-amber-300" />}
        title="Não foi possível carregar o catálogo"
        description="Confira a conexão e tente de novo."
        actionLabel="Tentar novamente"
        onAction={() => void load()}
      />
    );
  }
  if (!products) return <PageLoader message="Carregando o catálogo..." />;

  return (
    <div className="space-y-6 pb-24">
      <PageHeading
        title="Meu Catálogo"
        subtitle="Marque o que você produz. As Ofertas só mostram pedidos desses produtos."
        action={
          <Button variant="outline" onClick={() => setSuggesting(true)} className="border-amber-400 text-amber-700 hover:bg-amber-50">
            <MessageSquarePlus size={17} /> Sugerir novo produto
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar produto no catálogo..." accent="amber" className="w-full md:w-80" />
        <p className="text-sm text-amber-800 font-medium" aria-live="polite">
          {selection.size} {selection.size === 1 ? "selecionado" : "selecionados"}
          {search && ` · ${visible.length} ${visible.length === 1 ? "resultado" : "resultados"}`}
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Sprout size={56} className="text-gray-300" />} title="Nenhum produto encontrado." description="Tente outro nome ou sugira o produto." />
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {visible.map((product) => {
            const selected = selection.has(product.cdProduto);
            const priceText = selection.get(product.cdProduto) ?? "";
            const error = selected ? priceError(priceText) : null;
            return (
              <li key={product.cdProduto} className={`rc-produto-card ${selected ? "rc-produto-card-on" : "rc-produto-card-off"}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${product.nome ?? "Produto"}${selected ? ", no catálogo" : ""}`}
                  onClick={() => setSelection(toggle(selection, product.cdProduto))}
                  className="flex flex-col items-center text-center w-full"
                >
                  <span className="relative w-16 h-16 mb-3 block">
                    {product.imagemUrl ? (
                      <Image src={product.imagemUrl} alt="" fill sizes="64px" className="object-cover rounded-full shadow-sm" />
                    ) : (
                      <span className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">Sem foto</span>
                    )}
                    {selected && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white">
                        <CheckCircle size={13} />
                      </span>
                    )}
                  </span>
                  <span className={`font-bold text-sm leading-tight ${selected ? "text-amber-900" : "text-gray-700"}`}>{product.nome}</span>
                </button>

                {selected && (
                  <div className="mt-3 w-full">
                    <label className="text-[11px] font-bold text-amber-800 block mb-1 text-left" htmlFor={`preco-${product.cdProduto}`}>
                      Preço por kg (R$)
                    </label>
                    <input
                      id={`preco-${product.cdProduto}`}
                      inputMode="decimal"
                      value={priceText}
                      onChange={(e) => setSelection(setPrice(selection, product.cdProduto, e.target.value))}
                      placeholder="Ex.: 8,50"
                      aria-invalid={error !== null}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white ${
                        error ? "border-red-400" : "border-amber-200"
                      }`}
                    />
                    {error && <p className="text-[11px] text-red-600 font-bold mt-1 text-left">{error}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {dirty && (
        <div className="fixed bottom-20 lg:bottom-6 inset-x-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 z-30">
          <div className="max-w-xl mx-auto bg-white border border-amber-200 shadow-xl rounded-2xl p-3 flex items-center gap-3">
            <p className="flex-1 text-sm font-bold text-gray-700 pl-2">Você tem alterações não salvas.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelection(new Map(saved))}
              disabled={saving}
            >
              Desfazer
            </Button>
            <Button onClick={save} isLoading={saving} size="sm" className="bg-amber-600 hover:bg-amber-700">
              {!saving && <Save size={16} />} Salvar
            </Button>
          </div>
        </div>
      )}

      <SuggestionModal isOpen={suggesting} onClose={() => setSuggesting(false)} />
    </div>
  );
}
