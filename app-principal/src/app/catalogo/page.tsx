"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListChecks, PackageOpen, ShoppingCart, LayoutDashboard, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { CartPanel } from "@/components/mercado/CartPanel";
import { ProductCard } from "@/components/mercado/ProductCard";
import { QuotesTab } from "@/components/mercado/QuotesTab";
import { useMercadoData } from "@/components/mercado/useMercadoData";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { PageHeading } from "@/components/ui/PageHeading";
import { TabNav, tabId, tabPanelId } from "@/components/ui/TabNav";
import { useCart } from "@/hooks/useCart";
import { logout } from "@/lib/auth/logout";
import { formatBRL } from "@/lib/format/currency";
import { plural } from "@/lib/format/plural";
import { NO_FILTERS, categoriesOf, filterProducts, type CatalogFilters, type CatalogProduct, type SortKey } from "@/lib/mercado/catalog";

type Tab = "vitrine" | "cotacoes";

const SORTS = [
  { value: "nome", label: "Ordenar: A–Z" },
  { value: "preco_asc", label: "Preço: menor primeiro" },
  { value: "preco_desc", label: "Preço: maior primeiro" },
];

export default function CatalogoMercado() {
  // useSearchParams precisa de Suspense para a página poder ser montada no build.
  return (
    <Suspense fallback={<PageLoader message="Carregando o catálogo..." />}>
      <Catalogo />
    </Suspense>
  );
}

function Catalogo() {
  const router = useRouter();
  const params = useSearchParams();
  const { cart, total, add, setQty, remove, clear, sync } = useCart();
  const [tab, setTab] = useState<Tab>(params.get("aba") === "cotacoes" ? "cotacoes" : "vitrine");
  const [filters, setFilters] = useState<CatalogFilters>(NO_FILTERS);

  const onCatalog = useCallback(
    (list: CatalogProduct[]) => {
      const { removed, repriced } = sync(list);
      if (removed.length > 0) toast.warning(removed.length === 1 ? `${removed[0]} saiu do catálogo e foi retirado da cotação.` : `${removed.length} produtos saíram do catálogo e foram retirados da cotação: ${removed.join(", ")}.`);
      else if (repriced) toast.info("Alguns preços de referência foram atualizados na sua cotação.");
    },
    [sync],
  );
  const { perfil, products, loading, error, reload } = useMercadoData(onCatalog);

  const categories = useMemo(() => categoriesOf(products), [products]);
  const visible = useMemo(() => filterProducts(products, filters), [products, filters]);
  const quantities = useMemo(() => new Map(cart.map((item) => [item.id, item.qtd])), [cart]);

  async function leave() {
    await logout();
    router.push("/login");
  }

  if (loading) return <PageLoader message="Carregando o catálogo..." />;

  if (!perfil) {
    return (
      <div className="rc-page"><div className="rc-container">
        <EmptyState
          icon={<PackageOpen size={56} className="text-red-300" aria-hidden="true" />}
          title="Não foi possível abrir o catálogo"
          description={error || "Tente de novo em instantes."}
          actionLabel="Tentar de novo"
          onAction={() => void reload()}
        />
        <button type="button" onClick={leave} className="mx-auto block text-sm font-bold text-gray-500 hover:text-gray-800 h-11">Sair da conta</button>
      </div></div>
    );
  }

  if (perfil.status !== "APROVADO") return <StatusBanner status={perfil.status} onLogout={leave} />;

  const hasCart = cart.length > 0;
  const filtering = filters.query.trim() !== "" || filters.category !== NO_FILTERS.category || filters.sort !== NO_FILTERS.sort;

  return (
    <div className={`rc-page ${hasCart && tab === "vitrine" ? "pb-32 lg:pb-12" : ""}`}>
      <div className="rc-container">
        <PageHeading title={`Olá, ${perfil.nomeFantasia || "mercado"}`} subtitle="Monte uma cotação e os produtores da região respondem com ofertas." />

        <TabNav
          label="Áreas do mercado"
          activeTab={tab}
          onTabChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: "vitrine", label: "Nova cotação", icon: <LayoutDashboard size={18} aria-hidden="true" /> },
            { id: "cotacoes", label: "Minhas cotações", icon: <ListChecks size={18} aria-hidden="true" /> },
          ]}
        />

        {tab === "vitrine" && (
          <div role="tabpanel" id={tabPanelId("vitrine")} aria-labelledby={tabId("vitrine")} className={`grid gap-8 items-start ${hasCart ? "lg:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
            <div className="space-y-6 min-w-0">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_11rem_13rem]">
                  <SearchBar value={filters.query} onChange={(query) => setFilters({ ...filters, query })} placeholder="Buscar por nome..." />
                  <Select aria-label="Categoria" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} options={categories.map((category) => ({ value: category, label: category }))} />
                  <Select aria-label="Ordem" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })} options={SORTS} />
                </div>
                {filtering && (
                  <div className="flex items-center gap-3 text-xs" role="status">
                    <span className="text-gray-500">{plural(visible.length, "produto encontrado", "produtos encontrados")}</span>
                    <button type="button" onClick={() => setFilters(NO_FILTERS)} className="text-green-700 hover:underline font-bold h-8">Limpar filtros</button>
                  </div>
                )}
              </div>

              {visible.length === 0 ? (
                <EmptyState
                  icon={<PackageOpen size={48} aria-hidden="true" />}
                  title={products.length === 0 ? "O catálogo está vazio" : "Nenhum produto encontrado"}
                  description={products.length === 0 ? "A administração ainda não cadastrou produtos." : "Tente outro nome ou outra categoria."}
                  actionLabel={filtering ? "Limpar filtros" : undefined}
                  onAction={filtering ? () => setFilters(NO_FILTERS) : undefined}
                />
              ) : (
                <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${hasCart ? "md:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"}`}>
                  {visible.map((product) => (
                    <li key={product.cdProduto} className="flex [&>article]:w-full">
                      <ProductCard product={product} inCart={quantities.get(product.cdProduto) ?? 0} onAdd={add} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hasCart && <CartPanel cart={cart} total={total} onSetQty={setQty} onRemove={remove} onClear={clear} />}
          </div>
        )}

        {tab === "cotacoes" && (
          <div role="tabpanel" id={tabPanelId("cotacoes")} aria-labelledby={tabId("cotacoes")}>
            <QuotesTab onNew={() => setTab("vitrine")} />
          </div>
        )}
      </div>

      {/* Atalho no celular: a cotação fica abaixo da lista, esta barra leva até ela. */}
      {hasCart && tab === "vitrine" && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <a href="#cotacao" className="flex items-center justify-between gap-3 h-12 rounded-xl bg-green-600 px-4 text-white font-bold">
            <span className="flex items-center gap-2"><ShoppingCart size={18} aria-hidden="true" /> {plural(cart.length, "item", "itens")}</span>
            <span className="flex items-center gap-2">{formatBRL(total)} <ArrowDown size={16} aria-hidden="true" /></span>
          </a>
        </div>
      )}
    </div>
  );
}
