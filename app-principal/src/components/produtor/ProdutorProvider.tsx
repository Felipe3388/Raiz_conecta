"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { logout } from "@/lib/auth/logout";
import { api } from "@/lib/http/client";
import type { Mural } from "@/lib/produtor/mural";

export interface ProdutorPerfil {
  email: string;
  nomeFantasia: string | null;
  status: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
}

interface ProdutorContextValue {
  produtor: ProdutorPerfil;
  // O mural do produtor (null enquanto carrega ou se deu erro).
  mural: Mural | null;
  produtosNoCatalogo: number;
  muralError: boolean;
  reloadMural: () => Promise<void>;
  // Lê o produtor de novo (depois de editar o perfil, o nome no Mais acompanha).
  reloadProdutor: () => Promise<void>;
}

interface OfertasResponse extends Mural {
  produtosNoCatalogo?: number;
}

const ProdutorContext = createContext<ProdutorContextValue | null>(null);

export function useProdutor(): ProdutorContextValue {
  const value = useContext(ProdutorContext);
  if (!value) throw new Error("useProdutor precisa estar dentro de <ProdutorProvider>.");
  return value;
}

// Carrega o produtor logado e o mural uma vez e divide com todas as telas da área (Início, Catálogo, Ofertas...).
// Barra quem não pode estar aqui: sem sessão volta ao login (o cliente da API cuida do 401); sem cadastro completo vai
// para "completar perfil"; cadastro em análise ou recusado vê o aviso, como no app.
export function ProdutorProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [produtor, setProdutor] = useState<ProdutorPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [mural, setMural] = useState<Mural | null>(null);
  const [produtosNoCatalogo, setProdutosNoCatalogo] = useState(0);
  const [muralError, setMuralError] = useState(false);

  const reloadMural = useCallback(async () => {
    const result = await api<OfertasResponse>("/api/produtor/ofertas");
    if (!result.ok || !result.data) return void setMuralError(true);
    const { mural: abertos, minhas, resumo } = result.data;
    setMural({ mural: abertos, minhas, resumo });
    setProdutosNoCatalogo(result.data.produtosNoCatalogo ?? 0);
    setMuralError(false);
  }, []);

  // `true` quando o produtor foi lido (o resto da carga pode seguir).
  const readProdutor = useCallback(async (): Promise<ProdutorPerfil | null> => {
    const result = await api<ProdutorPerfil | null>("/api/vendedor/perfil", { cache: "no-store" });
    if (result.status === 403) {
      router.replace("/login");
      return null;
    }
    if (!result.ok) {
      toast.error("Não foi possível carregar o seu painel.", { description: result.error });
      return null;
    }
    if (!result.data) {
      router.replace("/completar-perfil");
      return null;
    }
    setProdutor(result.data);
    return result.data;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await readProdutor();
      if (!cancelled && loaded?.status === "APROVADO") await reloadMural();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [readProdutor, reloadMural]);

  const reloadProdutor = useCallback(async () => {
    await readProdutor();
  }, [readProdutor]);

  const value = useMemo(
    () => (produtor ? { produtor, mural, produtosNoCatalogo, muralError, reloadMural, reloadProdutor } : null),
    [produtor, mural, produtosNoCatalogo, muralError, reloadMural, reloadProdutor],
  );

  if (loading) return <PageLoader message="Carregando seu painel..." />;
  if (!produtor || !value) return null;
  if (produtor.status !== "APROVADO") {
    return (
      <StatusBanner
        status={produtor.status}
        onLogout={async () => {
          await logout();
          router.push("/login");
        }}
      />
    );
  }

  return <ProdutorContext.Provider value={value}>{children}</ProdutorContext.Provider>;
}
