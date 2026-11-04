"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, MessageSquarePlus, Save, Sprout } from "lucide-react";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { SuggestionModal } from "@/components/produtor/SuggestionModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { useProducerCatalog, type CatalogView } from "@/hooks/useProducerCatalog";
import { categoryIcon } from "@/lib/mercado/catalog";
import { priceError } from "@/lib/produtor/catalogSelection";

const VIEWS: { id: CatalogView; label: string }[] = [
  { id: "todos", label: "Todos os produtos" },
  { id: "meus", label: "No meu catálogo" },
];

// Meu Catálogo: o produtor marca o que vende e, se quiser, o preço que pede por kg (informação para a equipe).
// As Ofertas só mostram pedidos dos produtos marcados.
export default function CatalogoPage() {
  const { reloadMural } = useProdutor();
  const catalog = useProducerCatalog(reloadMural);
  const [suggesting, setSuggesting] = useState(false);

  if (catalog.error && !catalog.products) {
    return <EmptyState icon={<Sprout size={56} className="text-gray-300" aria-hidden="true" />} title="Não foi possível carregar o catálogo" description={catalog.error} actionLabel="Tentar de novo" onAction={() => void catalog.reload()} />;
  }
  if (!catalog.products) return <PageLoader message="Carregando o catálogo..." />;

  return (
    <div className="space-y-6 pb-28">
      <PageHeading
        title="Meu Catálogo"
        subtitle="Marque o que você produz. As Ofertas só mostram pedidos desses produtos."
        action={
          <Button variant="outline" onClick={() => setSuggesting(true)}>
            <MessageSquarePlus size={17} aria-hidden="true" /> Sugerir produto
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div role="radiogroup" aria-label="Mostrar" className="inline-flex p-1 rounded-xl bg-gray-200/70 self-start">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={catalog.view === option.id}
              onClick={() => catalog.setView(option.id)}
              className={`h-9 px-4 rounded-lg text-sm font-semibold transition-colors ${catalog.view === option.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {option.label}
              {option.id === "meus" && <span className="ml-1.5 tabular-nums text-green-700">{catalog.count}</span>}
            </button>
          ))}
        </div>
        <SearchBar value={catalog.search} onChange={catalog.setSearch} placeholder="Buscar produto" className="w-full md:w-72 md:ml-auto" />
      </div>

      {catalog.visible.length === 0 ? (
        <EmptyState
          icon={<Sprout size={56} className="text-gray-300" aria-hidden="true" />}
          title={catalog.view === "meus" && catalog.count === 0 ? "Nenhum produto marcado ainda" : "Nenhum produto encontrado"}
          description={catalog.view === "meus" && catalog.count === 0 ? "Volte para Todos os produtos e marque o que você produz." : "Tente outro nome ou sugira o produto para a equipe."}
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
          {catalog.visible.map((product) => {
            const selected = catalog.selection.has(product.cdProduto);
            const priceText = catalog.selection.get(product.cdProduto) ?? "";
            const error = selected ? priceError(priceText) : null;
            const name = product.nome ?? "Produto";
            return (
              <li key={product.cdProduto} className={`rounded-2xl border-2 bg-white p-4 transition-colors ${selected ? "border-green-600" : "border-gray-200 hover:border-gray-300"}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${name}${selected ? ", no catálogo" : ""}`}
                  onClick={() => catalog.toggle(product.cdProduto)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span className="relative w-12 h-12 shrink-0 grid place-items-center rounded-full bg-gray-100 text-2xl overflow-hidden" aria-hidden="true">
                    {product.imagemUrl ? <Image src={product.imagemUrl} alt="" fill sizes="48px" className="object-cover" /> : categoryIcon(product.tipo)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-gray-900 leading-tight truncate">{name}</span>
                    {product.tipo && <span className="block text-xs text-gray-500 truncate">{product.tipo}</span>}
                  </span>
                  <span className={`w-6 h-6 shrink-0 grid place-items-center rounded-full border-2 transition-colors ${selected ? "bg-green-600 border-green-600 text-white" : "border-gray-300"}`} aria-hidden="true">
                    {selected && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>

                {selected && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-600 block mb-1" htmlFor={`preco-${product.cdProduto}`}>
                      Seu preço por kg (opcional)
                    </label>
                    <input
                      id={`preco-${product.cdProduto}`}
                      inputMode="decimal"
                      value={priceText}
                      onChange={(e) => catalog.setPrice(product.cdProduto, e.target.value)}
                      placeholder="Ex.: 8,50"
                      aria-invalid={error !== null}
                      aria-describedby={error ? `preco-erro-${product.cdProduto}` : undefined}
                      className={`w-full h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white ${error ? "border-red-400" : "border-gray-300"}`}
                    />
                    {error && <p id={`preco-erro-${product.cdProduto}`} className="text-xs text-red-700 font-semibold mt-1">{error}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {catalog.dirty && (
        <div className="fixed bottom-24 lg:bottom-6 inset-x-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 z-30" role="region" aria-label="Alterações não salvas">
          <div className="max-w-xl mx-auto bg-white/95 backdrop-blur border border-gray-200 shadow-xl rounded-2xl p-3 flex items-center gap-3">
            <p className="flex-1 text-sm font-semibold text-gray-700 pl-2">Alterações não salvas no catálogo.</p>
            <Button variant="ghost" size="sm" onClick={catalog.discard} disabled={catalog.saving}>Descartar</Button>
            <Button onClick={catalog.save} isLoading={catalog.saving} size="sm">
              {!catalog.saving && <Save size={16} aria-hidden="true" />} Salvar catálogo
            </Button>
          </div>
        </div>
      )}

      <SuggestionModal isOpen={suggesting} onClose={() => setSuggesting(false)} />
    </div>
  );
}
