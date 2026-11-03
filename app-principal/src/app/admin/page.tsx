"use client";

import { useCallback, useState } from "react";
import { FileText, LayoutDashboard, Lightbulb, Package, RefreshCw, Scale, Users } from "lucide-react";
import { toast } from "sonner";

import { NewAdminModal } from "@/components/admin/NewAdminModal";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { PendingTab } from "@/components/admin/PendingTab";
import { CatalogTab } from "@/components/admin/CatalogTab";
import { ReasonModal, type ReasonRequest } from "@/components/admin/ReasonModal";
import { ScalesTab } from "@/components/admin/ScalesTab";
import { SuggestionsTab } from "@/components/admin/SuggestionsTab";
import { UserModal } from "@/components/admin/UserModal";
import { UsersTab } from "@/components/admin/UsersTab";
import { useAdminData } from "@/components/admin/useAdminData";
import { PageLoader } from "@/components/ui/PageLoader";
import { TabNav, tabId, tabPanelId } from "@/components/ui/TabNav";
import { useConfirm } from "@/components/ui/useConfirm";
import { isPending, userName, type AdminUser } from "@/lib/admin/types";
import { api } from "@/lib/http/client";

type TabKey = "dashboard" | "pendentes" | "gestao" | "catalogo" | "sugestoes" | "balancas";

export default function PainelAdmin() {
  const { users, products, suggestions, scales, loading, failed, reload } = useAdminData();
  const { confirm, dialog } = useConfirm();

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [details, setDetails] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState<ReasonRequest | null>(null);
  const [newAdminOpen, setNewAdminOpen] = useState(false);

  const reloadUsers = useCallback(() => reload(["users"]), [reload]);
  const reloadProducts = useCallback(() => reload(["products"]), [reload]);
  const reloadSuggestions = useCallback(() => reload(["suggestions", "products"]), [reload]);
  const reloadScales = useCallback(() => reload(["scales"]), [reload]);

  // Muda a situação da conta. O servidor atualiza o perfil e o acesso juntos e avisa a pessoa por e-mail.
  async function changeStatus(user: AdminUser, novoStatus: "APROVADO" | "REJEITADO" | "SUSPENSO", motivo?: string) {
    if (user.tipo === "admin") return;
    setBusyEmail(user.email);
    const result = await api("/api/admin/usuarios", { method: "PUT", json: { email: user.email, tipo: user.tipo, novoStatus, ...(motivo ? { motivo } : {}) } });
    setBusyEmail(null);
    if (!result.ok) return void toast.error(result.error);
    toast.success(novoStatus === "SUSPENSO" ? "Conta suspensa. A pessoa foi avisada por e-mail." : novoStatus === "APROVADO" ? "Conta aprovada." : "Cadastro recusado.");
    await reloadUsers();
  }

  function decide(user: AdminUser, status: "APROVADO" | "REJEITADO") {
    const approving = status === "APROVADO";
    confirm({
      title: approving ? "Aprovar cadastro" : "Recusar cadastro",
      description: `${approving ? "Liberar o acesso de" : "Recusar o cadastro de"} ${userName(user)}? A pessoa recebe um e-mail com o resultado.`,
      confirmLabel: approving ? "Sim, aprovar" : "Sim, recusar",
      variant: approving ? "success" : "danger",
      run: () => changeStatus(user, status),
    });
  }

  function reactivate(user: AdminUser) {
    confirm({
      title: "Reativar conta",
      description: `Devolver o acesso de ${userName(user)}?`,
      confirmLabel: "Reativar",
      variant: "success",
      run: () => changeStatus(user, "APROVADO"),
    });
  }

  function suspend(user: AdminUser) {
    setReason({
      title: "Suspender usuário",
      description: "Informe o motivo. Ele será enviado por e-mail para a pessoa.",
      confirmLabel: "Suspender conta",
      variant: "warning",
      run: (motivo) => changeStatus(user, "SUSPENSO", motivo),
    });
  }

  function remove(user: AdminUser) {
    setReason({
      title: "Exclusão permanente",
      description: `Esta ação não pode ser desfeita. Informe o motivo da exclusão de ${userName(user)}: ele será enviado por e-mail.`,
      confirmLabel: "Excluir permanentemente",
      variant: "danger",
      run: async (motivo) => {
        setBusyEmail(user.email);
        const result = await api(`/api/admin/usuarios?${new URLSearchParams({ email: user.email, tipo: user.tipo, motivo })}`, { method: "DELETE" });
        setBusyEmail(null);
        if (!result.ok) return void toast.error(result.error);
        toast.success("Usuário excluído.");
        await reloadUsers();
      },
    });
  }

  if (loading) return <PageLoader message="Carregando o painel..." />;

  const pending = users.filter(isPending);
  const tabs = [
    { id: "dashboard", label: "Visão geral", icon: <LayoutDashboard size={17} aria-hidden="true" /> },
    { id: "pendentes", label: "Aprovações", icon: <FileText size={17} aria-hidden="true" />, badge: pending.length },
    { id: "gestao", label: "Usuários", icon: <Users size={17} aria-hidden="true" /> },
    { id: "catalogo", label: "Catálogo", icon: <Package size={17} aria-hidden="true" /> },
    { id: "sugestoes", label: "Sugestões", icon: <Lightbulb size={17} aria-hidden="true" />, badge: suggestions.length },
    { id: "balancas", label: "Balanças", icon: <Scale size={17} aria-hidden="true" /> },
  ];

  return (
    <div className="rc-page">
      <div className="rc-container">
        <h1 className="sr-only">Painel do administrador</h1>

        {failed.length > 0 && (
          <div role="alert" className="rc-banner rc-banner-red">
            <p className="flex-1 text-sm font-semibold">Não foi possível carregar: {failed.join(", ")}. Os números abaixo podem estar incompletos.</p>
            <button type="button" onClick={() => reload()} className="h-10 px-4 rounded-xl bg-white border border-red-200 text-sm font-bold text-red-700 hover:bg-red-50">Tentar de novo</button>
          </div>
        )}

        <TabNav
          tabs={tabs}
          activeTab={tab}
          onTabChange={(id) => setTab(id as TabKey)}
          label="Seções do painel"
          rightSlot={
            <button type="button" onClick={() => reload()} className="flex items-center gap-1 h-10 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              <RefreshCw size={15} aria-hidden="true" /> Atualizar
            </button>
          }
        />

        <div role="tabpanel" id={tabPanelId(tab)} aria-labelledby={tabId(tab)} tabIndex={0} className="outline-none">
          {tab === "dashboard" && <OverviewTab users={users} products={products} suggestions={suggestions} scales={scales} />}
          {tab === "pendentes" && <PendingTab users={pending} busyEmail={busyEmail} onDecide={decide} />}
          {tab === "gestao" && (
            <UsersTab
              users={users}
              busyEmail={busyEmail}
              onDetails={setDetails}
              onSuspend={suspend}
              onReactivate={reactivate}
              onDelete={remove}
              onNewAdmin={() => setNewAdminOpen(true)}
            />
          )}
          {tab === "catalogo" && <CatalogTab products={products} onChanged={reloadProducts} />}
          {tab === "sugestoes" && <SuggestionsTab suggestions={suggestions} onChanged={reloadSuggestions} />}
          {tab === "balancas" && <ScalesTab scales={scales} onChanged={reloadScales} />}
        </div>
      </div>

      <UserModal user={details} onClose={() => setDetails(null)} onSaved={reloadUsers} />
      <ReasonModal request={reason} onClose={() => setReason(null)} />
      <NewAdminModal isOpen={newAdminOpen} onClose={() => setNewAdminOpen(false)} onCreated={reloadUsers} />
      {dialog}
    </div>
  );
}
