"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/http/client";
import type { CatalogProduct } from "@/lib/mercado/catalog";

export interface MercadoPerfil {
  email: string;
  nomeFantasia: string | null;
  status: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cep: string | null;
}

// O mercado logado e o catálogo, carregados juntos. `error` só aparece se nem o perfil carregou.
// `onCatalog` recebe o catálogo sempre que ele chega (use para conferir a cotação). Passe uma função estável (useCallback).
export function useMercadoData(onCatalog?: (products: CatalogProduct[]) => void) {
  const [perfil, setPerfil] = useState<MercadoPerfil | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const [profile, catalog] = await Promise.all([
      api<MercadoPerfil>("/api/mercado/perfil"),
      api<CatalogProduct[]>("/api/produtos"),
    ]);
    if (profile.ok && profile.data) {
      setPerfil(profile.data);
      setError("");
    } else {
      setError(profile.error);
    }
    const list = catalog.ok && Array.isArray(catalog.data) ? catalog.data : null;
    if (list) {
      setProducts(list);
      onCatalog?.(list);
    }
    setLoading(false);
    return list;
  }, [onCatalog]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da tela: o estado é preenchido quando a resposta chega
    void reload();
  }, [reload]);

  return { perfil, products, loading, error, reload };
}
