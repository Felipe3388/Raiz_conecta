"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/http/client";
import type { AdminProduct, AdminScale, AdminSuggestion, AdminUser } from "@/lib/admin/types";

const SOURCES = {
  users: { url: "/api/admin/usuarios", label: "usuários" },
  products: { url: "/api/produtos?todos=1", label: "catálogo" },
  suggestions: { url: "/api/produtor/sugestao", label: "sugestões" },
  scales: { url: "/api/admin/balancas", label: "balanças" },
} as const;

type SourceName = keyof typeof SOURCES;

// Carrega do servidor tudo o que o painel mostra. Uma parte que falha não derruba as outras: o painel avisa
// qual não carregou e oferece tentar de novo.
export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([]);
  const [scales, setScales] = useState<AdminScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<SourceName[]>([]);

  const reload = useCallback(async (only: SourceName[] = ["users", "products", "suggestions", "scales"]) => {
    const results = await Promise.all(only.map((name) => api<unknown[]>(SOURCES[name].url).then((result) => ({ name, result }))));
    const lost: SourceName[] = [];
    for (const { name, result } of results) {
      if (!result.ok || !Array.isArray(result.data)) {
        lost.push(name);
        continue;
      }
      if (name === "users") setUsers(result.data as AdminUser[]);
      if (name === "products") setProducts(result.data as AdminProduct[]);
      if (name === "suggestions") setSuggestions(result.data as AdminSuggestion[]);
      if (name === "scales") setScales(result.data as AdminScale[]);
    }
    setFailed((current) => [...current.filter((name) => !only.includes(name)), ...lost]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da tela: o estado é preenchido quando a resposta chega
    void reload();
  }, [reload]);

  return {
    users, products, suggestions, scales, loading,
    failed: failed.map((name) => SOURCES[name].label),
    reload,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;
