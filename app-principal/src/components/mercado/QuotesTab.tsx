"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/http/client";
import type { Pedido } from "@/lib/mercado/pedidos";
import { QuoteCard } from "./QuoteCard";

type Filter = "todas" | "ABERTA" | "CONCLUIDA" | "CANCELADA";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "ABERTA", label: "Em andamento" },
  { id: "CONCLUIDA", label: "Concluídas" },
  { id: "CANCELADA", label: "Canceladas" },
];

interface QuotesTabProps {
  onNew: () => void;
}

export function QuotesTab({ onNew }: QuotesTabProps) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [failed, setFailed] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");

  const load = useCallback(async (quiet = false) => {
    const result = await api<Pedido[]>("/api/mercado/demandas");
    if (result.ok && Array.isArray(result.data)) {
      setPedidos(result.data);
      setFailed("");
    } else {
      setFailed(result.error);
      if (!quiet) toast.error(result.error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da aba: o estado é preenchido quando a resposta chega
    void load();
    // Voltou para a aba do navegador: as ofertas dos produtores podem ter chegado.
    const onVisible = () => document.visibilityState === "visible" && void load(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  if (pedidos === null) {
    return failed ? (
      <EmptyState icon={<PackageOpen size={56} className="text-red-300" aria-hidden="true" />} title="Não foi possível carregar" description={failed} actionLabel="Tentar de novo" onAction={() => void load()} />
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-busy="true" aria-label="Carregando cotações">
        {[0, 1].map((n) => <div key={n} className="h-72 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return <EmptyState icon={<PackageOpen size={56} className="text-gray-300" aria-hidden="true" />} title="Nenhuma cotação ainda" description="Monte sua primeira cotação e peça produtos aos produtores da região." actionLabel="Nova cotação" onAction={onNew} />;
  }

  const visible = pedidos.filter((pedido) => filter === "todas" || pedido.status === filter);
  const count = (id: Filter) => (id === "todas" ? pedidos.length : pedidos.filter((pedido) => pedido.status === id).length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar cotações" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`h-10 px-4 rounded-full text-sm font-bold border transition-colors ${filter === item.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
            >
              {item.label} <span className="opacity-60">{count(item.id)}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className="flex items-center gap-1 h-10 text-sm font-bold text-gray-500 hover:text-gray-800">
          <RefreshCw size={15} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-gray-400 font-medium bg-white border-2 border-dashed border-gray-200 rounded-2xl">Nenhuma cotação neste filtro.</p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visible.map((pedido) => (
            <li key={pedido.id}><QuoteCard pedido={pedido} onChanged={() => void load(true)} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
