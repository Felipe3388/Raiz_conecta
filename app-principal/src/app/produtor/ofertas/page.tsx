"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, LayoutDashboard, ListChecks, Sprout } from "lucide-react";
import { toast } from "sonner";
import { DemandCard } from "@/components/produtor/DemandCard";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { PageHeading } from "@/components/ui/PageHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { TabNav } from "@/components/ui/TabNav";
import { normalizeText } from "@/lib/text/normalize";
import type { MuralItem } from "@/lib/produtor/mural";
import { useRouter } from "next/navigation";

function OfertasContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { mural, produtosNoCatalogo, reloadMural } = useProdutor();
  const [tab, setTab] = useState(params.get("aba") === "minhas" ? "minhas" : "responder");
  const [search, setSearch] = useState("");

  if (!mural) return <p className="text-sm text-gray-500">Carregando...</p>;

  const list = tab === "responder" ? mural.mural : mural.minhas;
  const filtered = list.filter((item) => normalizeText(item.produto).includes(normalizeText(search)));

  async function offer(item: MuralItem, quantity: number): Promise<boolean> {
    try {
      const res = await fetch("/api/produtor/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandaId: item.id, quantidade: quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não foi possível registrar a oferta.");
        // Outro produtor pode ter fechado o pedido: atualiza a lista.
        if (res.status === 400) await reloadMural();
        return false;
      }
      toast.success("Oferta registrada!", { description: "O mercado será avisado." });
      await reloadMural();
      return true;
    } catch {
      toast.error("Erro de conexão. Tente de novo.");
      return false;
    }
  }

  const tabs = [
    { id: "responder", label: `Para responder (${mural.mural.length})`, icon: <LayoutDashboard size={17} /> },
    { id: "minhas", label: `Minhas ofertas (${mural.minhas.length})`, icon: <ListChecks size={17} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeading title="Ofertas" subtitle="Pedidos dos mercados para os produtos do seu catálogo." />

      <TabNav tabs={tabs} activeTab={tab} onTabChange={setTab} className="mb-0" />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por produto..." className="w-full md:w-96" />

      {tab === "responder" && produtosNoCatalogo === 0 ? (
        <EmptyState
          icon={<Sprout size={56} className="text-amber-300" />}
          title="Escolha o que você produz"
          description="Os pedidos só aparecem para os produtos que você marcar no catálogo."
          actionLabel="Abrir o catálogo"
          onAction={() => router.push("/produtor/catalogo")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={56} className="text-gray-300" />}
          title={tab === "responder" ? "Nenhum pedido esperando resposta." : "Você ainda não fez ofertas."}
          description="Volte mais tarde ou diversifique seu catálogo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <DemandCard key={item.id} item={item} onOffer={tab === "responder" ? offer : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfertasPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Carregando...</p>}>
      <OfertasContent />
    </Suspense>
  );
}
