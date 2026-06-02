/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Users, Trash2, FileText,
  Loader2, RefreshCw, Package, Plus, Tag, Lightbulb,
  ShieldPlus, LayoutDashboard, TrendingUp, Activity, Store, Leaf,
  ArrowUpRight, Edit2, Eye, UserCog, ChevronDown, ChevronUp
} from "lucide-react";

import { Card }         from "@/components/ui/Card";
import { Button }       from "@/components/ui/Button";
import { Input }        from "@/components/ui/Input";
import { Badge }        from "@/components/ui/Badge";
import { Modal }        from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCard }     from "@/components/ui/StatCard";
import { TabNav }       from "@/components/ui/TabNav";
import { EmptyState }   from "@/components/ui/EmptyState";
import { SearchBar }    from "@/components/ui/SearchBar";
import { PageLoader }   from "@/components/ui/PageLoader";
import { InfoRow }      from "@/components/ui/InfoRow";
import { Select }       from "@/components/ui/Select";

const CATEGORIAS = [
  { value: "Frutas",   label: "Frutas"   },
  { value: "Verduras", label: "Verduras" },
  { value: "Legumes",  label: "Legumes"  },
  { value: "Grãos",    label: "Grãos"    },
  { value: "Outros",   label: "Outros"   },
];
const UNIDADES = [
  { value: "Kg",      label: "Kg"    },
  { value: "Unidade", label: "Un"    },
  { value: "Maço",    label: "Maço"  },
  { value: "Caixa",   label: "Caixa" },
];

export default function PainelAdmin() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalAdminOpen, setIsModalAdminOpen] = useState(false);
  const [criandoAdmin, setCriandoAdmin] = useState(false);
  const [formAdmin, setFormAdmin] = useState({ email: "", senha: "" });

  const [abaAtual, setAbaAtual] = useState("dashboard");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [formProduto, setFormProduto] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" });
  const [fotoProduto, setFotoProduto] = useState<File | null>(null);
  const [produtosExpandidos, setProdutosExpandidos] = useState<Set<number>>(new Set());

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: "", description: "", confirmLabel: "Confirmar",
    variant: "warning" as "danger" | "warning" | "success" | "info",
    onConfirm: () => {},
  });
  const fecharConfirmacao = () => setConfirmConfig((p) => ({ ...p, isOpen: false }));

  const [modalMotivo, setModalMotivo] = useState({
    isOpen: false, title: "", descricao: "", confirmLabel: "Confirmar",
    variant: "warning" as "danger" | "warning",
    motivo: "", onConfirm: (_motivo: string) => {},
  });
  const fecharModalMotivo = () => setModalMotivo((p) => ({ ...p, isOpen: false, motivo: "" }));

  const [isModalPromoverOpen, setIsModalPromoverOpen] = useState(false);
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<any>(null);
  const [formPromocao, setFormPromocao] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg" });

  const [isModalEditarProdutoOpen, setIsModalEditarProdutoOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [formEditarProduto, setFormEditarProduto] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" });
  const [fotoEditarProduto, setFotoEditarProduto] = useState<File | null>(null);

  const [isModalUsuarioOpen, setIsModalUsuarioOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);
  const [editandoUsuario, setEditandoUsuario] = useState(false);
  const [formEditarUsuario, setFormEditarUsuario] = useState({ nomeFantasia: "", telefone: "", cidade: "", estado: "" });
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resU, resP, resS] = await Promise.all([
        fetch("/api/admin/usuarios"), fetch("/api/produtos"), fetch("/api/produtor/sugestao"),
      ]);
      if (resU.ok) setUsuarios(await resU.json());
      if (resP.ok) setProdutos(await resP.json());
      if (resS.ok) setSugestoes(await resS.json());
    } catch { toast.error("Erro ao carregar dados do sistema."); }
    finally { setLoading(false); }
  };
  useEffect(() => { carregarDados(); }, []);

  const toggleProdutoExpandido = (id: number) =>
    setProdutosExpandidos((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const alterarStatusSimples = (email: string, tipo: string, novoStatus: string) => {
    setConfirmConfig({
      isOpen: true,
      title: novoStatus === "APROVADO" ? "Aprovar Usuário" : "Rejeitar Usuário",
      description: `Confirma ${novoStatus === "APROVADO" ? "a aprovação" : "a rejeição"} deste usuário?`,
      confirmLabel: "Sim, confirmar",
      variant: novoStatus === "APROVADO" ? "success" : "danger",
      onConfirm: async () => {
        setProcessando(email);
        try {
          const res = await fetch("/api/admin/usuarios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, tipo, novoStatus }) });
          if (res.ok) { carregarDados(); toast.success(`Usuário ${novoStatus.toLowerCase()} com sucesso!`); }
        } catch { toast.error("Falha na conexão."); }
        finally { setProcessando(null); fecharConfirmacao(); }
      },
    });
  };

  const suspenderUsuario = (email: string, tipo: string) =>
    setModalMotivo({
      isOpen: true, title: "Suspender Usuário",
      descricao: "Informe o motivo. Será enviado por e-mail ao usuário.",
      confirmLabel: "Suspender Conta", variant: "warning", motivo: "",
      onConfirm: async (motivo) => {
        setProcessando(email);
        try {
          const res = await fetch("/api/admin/usuarios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, tipo, novoStatus: "SUSPENSO", motivo }) });
          if (res.ok) { carregarDados(); toast.success("Usuário suspenso. E-mail enviado."); }
        } catch { toast.error("Falha na conexão."); }
        finally { setProcessando(null); fecharModalMotivo(); }
      },
    });

  const excluirUsuario = (email: string, tipo: string) =>
    setModalMotivo({
      isOpen: true, title: "Exclusão Permanente",
      descricao: "⚠️ Esta ação não pode ser desfeita. Informe o motivo — ele será enviado por e-mail antes da exclusão.",
      confirmLabel: "Excluir Permanentemente", variant: "danger", motivo: "",
      onConfirm: async (motivo) => {
        setProcessando(email);
        try {
          const res = await fetch(`/api/admin/usuarios?${new URLSearchParams({ email, tipo, motivo })}`, { method: "DELETE" });
          if (res.ok) { carregarDados(); toast.success("Usuário excluído permanentemente."); }
        } catch { toast.error("Erro de conexão."); }
        finally { setProcessando(null); fecharModalMotivo(); }
      },
    });

  const abrirModalUsuario = (user: any) => {
    setUsuarioSelecionado(user);
    setFormEditarUsuario({ nomeFantasia: user.nomeFantasia || user.razaoSocial || "", telefone: user.telefone || "", cidade: user.cidade || "", estado: user.estado || "" });
    setEditandoUsuario(false);
    setIsModalUsuarioOpen(true);
  };

  const salvarEdicaoUsuario = async () => {
    setSalvandoUsuario(true);
    try {
      const res = await fetch("/api/admin/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: usuarioSelecionado.email, tipo: usuarioSelecionado.tipo, ...formEditarUsuario }) });
      if (res.ok) { carregarDados(); setEditandoUsuario(false); toast.success("Dados atualizados."); }
      else toast.error("Erro ao atualizar usuário.");
    } catch { toast.error("Erro de conexão."); }
    finally { setSalvandoUsuario(false); }
  };

  const apagarProduto = (id: number) =>
    setConfirmConfig({
      isOpen: true, title: "Remover Produto", description: "Deletar este produto do catálogo oficial?",
      confirmLabel: "Deletar", variant: "danger",
      onConfirm: async () => {
        try { const res = await fetch(`/api/produtos?id=${id}`, { method: "DELETE" }); if (res.ok) { carregarDados(); toast.info("Produto removido."); } }
        catch { toast.error("Erro de conexão."); }
        finally { fecharConfirmacao(); }
      },
    });

  const apagarSugestao = (id: number) =>
    setConfirmConfig({
      isOpen: true, title: "Descartar Sugestão", description: "Apagar esta sugestão? O produtor não será notificado.",
      confirmLabel: "Descartar", variant: "danger",
      onConfirm: async () => {
        setProcessando(id);
        try { const res = await fetch(`/api/produtor/sugestao?id=${id}`, { method: "DELETE" }); if (res.ok) { carregarDados(); toast.info("Sugestão removida."); } }
        catch { toast.error("Erro ao remover sugestão."); }
        finally { setProcessando(null); fecharConfirmacao(); }
      },
    });

  const abrirModalPromover = (sug: any) => {
    setSugestaoSelecionada(sug);
    setFormPromocao({ nome: sug.nomeProduto, tipo: "Frutas", preco: sug.precoSugerido ? String(sug.precoSugerido) : "", unidadePadrao: "Kg" });
    setIsModalPromoverOpen(true);
  };

  const confirmarPromocao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPromocao.preco || !formPromocao.nome) return toast.warning("Preencha o nome e o preço.");
    setProcessando(sugestaoSelecionada.id);
    try {
      const res = await fetch("/api/admin/promover-sugestao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idSugestao: sugestaoSelecionada.id, ...formPromocao }) });
      if (res.ok) { carregarDados(); setIsModalPromoverOpen(false); toast.success("Produto adicionado ao catálogo!"); }
      else toast.error("Erro ao promover a sugestão.");
    } catch { toast.error("Erro de conexão."); }
    finally { setProcessando(null); }
  };

  const abrirModalEditarProduto = (prod: any) => {
    setProdutoEditando(prod);
    setFormEditarProduto({ nome: prod.nome, tipo: prod.tipo, preco: String(prod.preco), unidadePadrao: prod.unidadePadrao, descricao: prod.descricao || "" });
    setFotoEditarProduto(null);
    setIsModalEditarProdutoOpen(true);
  };

  const salvarEdicaoProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEditarProduto.preco || !formEditarProduto.nome) return toast.warning("Preencha nome e preço.");
    setProcessando(produtoEditando.cdProduto);
    try {
      const fd = new FormData();
      fd.append("id", String(produtoEditando.cdProduto));
      fd.append("nome", formEditarProduto.nome);
      fd.append("tipo", formEditarProduto.tipo);
      fd.append("preco", formEditarProduto.preco);
      fd.append("unidadePadrao", formEditarProduto.unidadePadrao);
      fd.append("descricao", formEditarProduto.descricao);
      if (fotoEditarProduto) fd.append("file", fotoEditarProduto);

      const res = await fetch("/api/produtos", { method: "PUT", body: fd });
      if (res.ok) { carregarDados(); setIsModalEditarProdutoOpen(false); toast.success("Produto atualizado!"); }
      else toast.error("Erro ao atualizar o produto.");
    } catch { toast.error("Erro de conexão."); }
    finally { setProcessando(null); }
  };

  const criarNovoAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAdmin.email || !formAdmin.senha) return toast.warning("Preencha e-mail e senha.");
    setCriandoAdmin(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/novo-admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formAdmin) });
      const data = await res.json();
      if (res.ok) { toast.success("Novo administrador criado!"); setFormAdmin({ email: "", senha: "" }); setIsModalAdminOpen(false); carregarDados(); }
      else toast.error(data.error || "Erro ao criar administrador.");
    } catch { toast.error("Erro de conexão."); }
    finally { setCriandoAdmin(false); }
  };

  const adicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduto.nome || !formProduto.preco) return toast.warning("Preencha nome e preço.");
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("nome", formProduto.nome); fd.append("tipo", formProduto.tipo);
    fd.append("preco", formProduto.preco); fd.append("unidadePadrao", formProduto.unidadePadrao);
    fd.append("descricao", formProduto.descricao);
    if (fotoProduto) fd.append("file", fotoProduto);
    try {
      const res = await fetch("/api/produtos", { method: "POST", body: fd });
      if (res.ok) { toast.success("Produto adicionado!"); setFormProduto({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" }); setFotoProduto(null); carregarDados(); }
      else toast.error("Erro ao salvar produto.");
    } catch { toast.error("Erro de conexão."); }
    finally { setIsSubmitting(false); }
  };

  if (loading && usuarios.length === 0)
    return <PageLoader message="Carregando sistema administrativo..." />;

  const pendentes   = usuarios.filter((u) => u.status === "EM_ANALISE");
  const ativos      = usuarios.filter((u) => u.status !== "EM_ANALISE");
  const listaGestao = ativos.filter((u) => {
    const matchBusca = (u.nomeFantasia || u.razaoSocial)?.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroBusca.toLowerCase());
    const matchTipo   = filtroTipo   === "todos" || u.tipo   === filtroTipo;
    const matchStatus = filtroStatus === "todos" || u.status === filtroStatus;
    return matchBusca && matchTipo && matchStatus;
  });

  const TABS = [
    { id: "dashboard", label: "Visão Geral",         icon: <LayoutDashboard size={17} />, color: "purple" },
    { id: "pendentes", label: "Aprovações Pendentes", icon: <FileText size={17} />,        color: "amber",  badge: pendentes.length },
    { id: "gestao",    label: "Gestão de Usuários",   icon: <Users size={17} />,           color: "blue"   },
    { id: "catalogo",  label: "Catálogo Oficial",     icon: <Package size={17} />,         color: "green"  },
    { id: "sugestoes", label: "Sugestões",            icon: <Lightbulb size={17} />,       color: "amber",  badge: sugestoes.length },
  ];

  return (
    <div className="rc-page">
      <div className="rc-container">

        <TabNav
          tabs={TABS}
          activeTab={abaAtual}
          onTabChange={setAbaAtual}
          rightSlot={
            <button onClick={carregarDados} className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors">
              <RefreshCw size={15} /> Atualizar
            </button>
          }
        />

        {/* ── VISÃO GERAL ── */}
        {abaAtual === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total de Usuários"    value={usuarios.length}                                                                  icon={<Users size={24} />}   color="blue"   />
              <StatCard label="Produtores Ativos"    value={usuarios.filter((u) => u.tipo === "produtor" && u.status === "APROVADO").length}  icon={<Leaf size={24} />}    color="green"  />
              <StatCard label="Mercados Ativos"      value={usuarios.filter((u) => u.tipo === "mercado"  && u.status === "APROVADO").length}  icon={<Store size={24} />}   color="orange" />
              <StatCard label="Produtos no Catálogo" value={produtos.length}                                                                  icon={<Package size={24} />} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card flat className="p-6">
                <h3 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                  <Activity size={18} className="text-red-500" /> Resumo de Operações
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Aprovações Pendentes",  value: `${pendentes.length} conta${pendentes.length !== 1 ? "s" : ""}`,                            variant: pendentes.length > 0 ? "warning" : "success" },
                    { label: "Contas Suspensas",       value: `${usuarios.filter((u) => u.status === "SUSPENSO").length} conta${usuarios.filter((u) => u.status === "SUSPENSO").length !== 1 ? "s" : ""}`, variant: "danger"  },
                    { label: "Sugestões de Produtos",  value: `${sugestoes.length} nova${sugestoes.length !== 1 ? "s" : ""}`,                             variant: "neutral" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">{row.label}</span>
                      <Badge variant={row.variant as any}>{row.value}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card flat className="p-6">
                <h3 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                  <TrendingUp size={18} className="text-blue-500" /> Últimos Cadastrados
                </h3>
                <div className="space-y-2">
                  {usuarios.slice(-4).reverse().map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{u.nomeFantasia || u.razaoSocial || "Sem nome"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <Badge variant={u.tipo === "produtor" ? "success" : u.tipo === "admin" ? "warning" : "neutral"}>{u.tipo}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── PENDENTES ── */}
        {abaAtual === "pendentes" && (
          pendentes.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={56} className="text-green-300" />}
              title="Tudo limpo por aqui!"
              description="Não há novos cadastros aguardando aprovação."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendentes.map((user) => (
                <Card key={user.email} flat className="p-6 border-amber-200 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-amber-100">
                      <div>
                        <Badge variant={user.tipo === "produtor" ? "success" : "neutral"} className="mb-2">{user.tipo === "produtor" ? "Produtor Rural" : "Mercado"}</Badge>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{user.nomeFantasia || user.razaoSocial}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-6">
                      <InfoRow label={user.tipoDoc || "Doc"} value={user.documento} />
                      <InfoRow label="Cidade" value={`${user.cidade} — ${user.estado}`} />
                      {user.urlDocumento && (
                        <a href={user.urlDocumento} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline mt-2 pt-2 border-t border-gray-100 w-full">
                          <FileText size={14} /> Ver documento enviado
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "REJEITADO")} isLoading={processando === user.email} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-11">
                      <XCircle size={17} /> Recusar
                    </Button>
                    <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "APROVADO")} isLoading={processando === user.email} className="flex-1 h-11">
                      <CheckCircle size={17} /> Aprovar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ── GESTÃO ── */}
        {abaAtual === "gestao" && (
          <Card flat className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <h2 className="rc-section-title ml-2">Usuários na Base de Dados</h2>
                <Button onClick={() => setIsModalAdminOpen(true)} className="whitespace-nowrap bg-gray-900 hover:bg-black">
                  <ShieldPlus size={17} /> Novo Admin
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBar value={filtroBusca} onChange={setFiltroBusca} placeholder="Buscar por nome ou e-mail..." accent="blue" className="flex-1" />
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rc-select w-full sm:w-40 text-sm">
                  <option value="todos">Todos os tipos</option>
                  <option value="produtor">Produtor</option>
                  <option value="mercado">Mercado</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="rc-select w-full sm:w-44 text-sm">
                  <option value="todos">Todos os status</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="REJEITADO">Rejeitado</option>
                </select>
              </div>
              {(filtroBusca || filtroTipo !== "todos" || filtroStatus !== "todos") && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{listaGestao.length} resultado(s)</span>
                  <button onClick={() => { setFiltroBusca(""); setFiltroTipo("todos"); setFiltroStatus("todos"); }} className="text-xs text-blue-600 hover:underline font-bold cursor-pointer">Limpar filtros</button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="rc-table min-w-[700px]">
                <thead>
                  <tr>
                    <th className="pl-6">Usuário</th>
                    <th>Tipo</th>
                    <th>Documento</th>
                    <th>Status</th>
                    <th className="text-right pr-6">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaGestao.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium">Nenhum usuário encontrado.</td></tr>
                  ) : listaGestao.map((user) => (
                    <tr key={user.email}>
                      <td className="pl-6">
                        <p className="font-bold text-gray-900">{user.nomeFantasia || user.razaoSocial}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </td>
                      <td><Badge variant={user.tipo === "produtor" ? "success" : user.tipo === "admin" ? "warning" : "neutral"}>{user.tipo}</Badge></td>
                      <td>
                        <p className="text-xs text-gray-700 font-semibold">{user.tipoDoc || "—"}</p>
                        <p className="text-xs text-gray-400">{user.documento || "—"}</p>
                      </td>
                      <td><Badge variant={user.status === "APROVADO" ? "success" : user.status === "SUSPENSO" ? "warning" : "danger"}>{user.status}</Badge></td>
                      <td className="pr-6">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => abrirModalUsuario(user)} className="px-3 h-8 flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition">
                            <UserCog size={14} /> Detalhes
                          </button>
                          {user.tipo !== "admin" && (
                            user.status === "APROVADO"
                              ? <Button onClick={() => suspenderUsuario(user.email, user.tipo)} isLoading={processando === user.email} variant="outline" size="sm" className="h-8 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-50">Suspender</Button>
                              : <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "APROVADO")} isLoading={processando === user.email} variant="outline" size="sm" className="h-8 px-3 text-xs border-green-300 text-green-700 hover:bg-green-50">Reativar</Button>
                          )}
                          <button onClick={() => excluirUsuario(user.email, user.tipo)} disabled={processando === user.email} className="px-3 h-8 flex items-center text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-lg transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── CATÁLOGO ── */}
        {abaAtual === "catalogo" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card flat className="p-6 h-fit">
              <h2 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                <Plus size={18} className="text-green-600" /> Cadastrar Produto
              </h2>
              <form onSubmit={adicionarProduto} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Foto (Opcional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoProduto(e.target.files?.[0] || null)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 cursor-pointer" />
                </div>
                <Input label="Nome do Produto" name="nome" value={formProduto.nome} onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })} placeholder="Ex: Maçã Fuji" />
                <div className="flex gap-3">
                  <Select label="Categoria" options={CATEGORIAS} value={formProduto.tipo} onChange={(e) => setFormProduto({ ...formProduto, tipo: e.target.value })} />
                  <Select label="Unidade"   options={UNIDADES}    value={formProduto.unidadePadrao} onChange={(e) => setFormProduto({ ...formProduto, unidadePadrao: e.target.value })} />
                </div>
                <Input label="Preço Sugerido (R$)" name="preco" type="number" step="0.01" value={formProduto.preco} onChange={(e) => setFormProduto({ ...formProduto, preco: e.target.value })} placeholder="Ex: 5.90" />
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Descrição (Opcional)</label>
                  <textarea value={formProduto.descricao} onChange={(e) => setFormProduto({ ...formProduto, descricao: e.target.value })} placeholder="Variedade, características..." rows={3} className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
                <Button isLoading={isSubmitting} type="submit" className="w-full h-11">Adicionar ao Catálogo</Button>
              </form>
            </Card>

            <Card flat className="p-6 lg:col-span-2">
              <h2 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                <Tag size={18} className="text-green-600" /> Vitrine Oficial <span className="text-gray-400 font-normal text-sm ml-1">({produtos.length})</span>
              </h2>
              {produtos.length === 0 ? (
                <div className="text-center text-gray-400 py-12 font-medium">Nenhum produto cadastrado ainda.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {produtos.map((prod) => {
                    const expandido = produtosExpandidos.has(prod.cdProduto);
                    return (
                      <div key={prod.cdProduto} className="border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center relative group hover:border-green-400 hover:shadow-sm transition-all bg-white">
                        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button onClick={() => abrirModalEditarProduto(prod)} className="bg-white text-blue-500 hover:text-blue-700 rounded-full p-1.5 shadow-sm border border-blue-100"><Edit2 size={13} /></button>
                          <button onClick={() => apagarProduto(prod.cdProduto)} className="bg-white text-gray-300 hover:text-red-500 rounded-full p-1.5 shadow-sm border border-gray-100"><Trash2 size={13} /></button>
                        </div>
                        {prod.imagemUrl ? (
                          <Image src={prod.imagemUrl} alt={prod.nome} width={80} height={80} className="w-20 h-20 object-cover rounded-full mb-3 border-4 border-white shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-full mb-3 flex items-center justify-center text-gray-400 text-xs font-bold shadow-sm border-4 border-white">Sem Foto</div>
                        )}
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{prod.nome}</h3>
                        <Badge variant="neutral" className="mt-1.5">{prod.tipo}</Badge>
                        <p className="text-green-700 font-black mt-2.5 text-sm bg-green-50 px-3 py-1 rounded-lg w-full">
                          R$ {Number(prod.preco).toFixed(2)} <span className="text-gray-400 font-normal">/ {prod.unidadePadrao}</span>
                        </p>
                        {prod.descricao && (
                          <button onClick={() => toggleProdutoExpandido(prod.cdProduto)} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold">
                            {expandido ? <><ChevronUp size={12} /> Recolher</> : <><ChevronDown size={12} /> Ver mais</>}
                          </button>
                        )}
                        {expandido && <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5 w-full text-left leading-relaxed border border-gray-100">{prod.descricao}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── SUGESTÕES ── */}
        {abaAtual === "sugestoes" && (
          sugestoes.length === 0 ? (
            <EmptyState icon={<Lightbulb size={56} className="text-amber-300" />} title="Tudo lido!" description="Nenhuma sugestão nova dos produtores no momento." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sugestoes.map((sug) => (
                <Card key={sug.id} flat className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <Badge variant="warning" className="mb-2">Nova Ideia</Badge>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">{sug.nomeProduto}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Por: {sug.emailProdutor}</p>
                    </div>
                    {sug.imagemUrl && (
                      <div className="w-full aspect-square relative mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                        <Image src={sug.imagemUrl} alt="Sugestão" fill className="object-cover" />
                      </div>
                    )}
                    <div className="rc-banner rc-banner-amber rounded-xl p-3.5 text-sm mb-5 flex flex-col gap-1">
                      <span className="italic">"{sug.descricao || "Sem descrição."}"</span>
                      {sug.precoSugerido && <span className="font-black text-green-700 not-italic">Preço sugerido: R$ {Number(sug.precoSugerido).toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => abrirModalPromover(sug)} isLoading={processando === sug.id} className="w-full h-11">
                      <ArrowUpRight size={17} /> Revisar e Promover
                    </Button>
                    <Button onClick={() => apagarSugestao(sug.id)} disabled={processando === sug.id} variant="ghost" className="w-full h-9 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={15} /> Descartar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── MODAIS ── */}
      <ConfirmModal isOpen={confirmConfig.isOpen} onClose={fecharConfirmacao} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} description={confirmConfig.description} confirmLabel={confirmConfig.confirmLabel} variant={confirmConfig.variant} isLoading={processando !== null} />

      <Modal isOpen={modalMotivo.isOpen} onClose={fecharModalMotivo} title={modalMotivo.title}>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-gray-600">{modalMotivo.descricao}</p>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Motivo <span className="text-red-500">*</span></label>
            <textarea value={modalMotivo.motivo} onChange={(e) => setModalMotivo((p) => ({ ...p, motivo: e.target.value }))} placeholder="Descreva o motivo de forma clara..." rows={4} className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={fecharModalMotivo} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
            <Button isLoading={processando !== null} onClick={() => modalMotivo.onConfirm(modalMotivo.motivo)} disabled={!modalMotivo.motivo.trim()} className={`flex-1 ${modalMotivo.variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
              {modalMotivo.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalUsuarioOpen} onClose={() => setIsModalUsuarioOpen(false)} title="Detalhes do Usuário">
        {usuarioSelecionado && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={usuarioSelecionado.tipo === "produtor" ? "success" : usuarioSelecionado.tipo === "admin" ? "warning" : "neutral"}>{usuarioSelecionado.tipo}</Badge>
                <Badge variant={usuarioSelecionado.status === "APROVADO" ? "success" : usuarioSelecionado.status === "SUSPENSO" ? "warning" : "danger"}>{usuarioSelecionado.status}</Badge>
              </div>
              {!editandoUsuario && usuarioSelecionado.tipo !== "admin" && (
                <button onClick={() => setEditandoUsuario(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                  <Edit2 size={13} /> Editar
                </button>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-0.5">
              <InfoRow label="E-mail" value={usuarioSelecionado.email} />
              {!editandoUsuario ? (
                <>
                  <InfoRow label="Nome"      value={usuarioSelecionado.nomeFantasia || usuarioSelecionado.razaoSocial} />
                  <InfoRow label="Telefone"  value={usuarioSelecionado.telefone} />
                  <InfoRow label="Cidade"    value={`${usuarioSelecionado.cidade || "—"} / ${usuarioSelecionado.estado || "—"}`} />
                  <InfoRow label="Documento" value={`${usuarioSelecionado.tipoDoc}: ${usuarioSelecionado.documento}`} />
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <Input label="Nome / Razão Social" value={formEditarUsuario.nomeFantasia} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, nomeFantasia: e.target.value })} />
                  <Input label="Telefone"            value={formEditarUsuario.telefone}     onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, telefone: e.target.value })} />
                  <div className="flex gap-3">
                    <Input label="Cidade" value={formEditarUsuario.cidade} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, cidade: e.target.value })} />
                    <Input label="UF"     value={formEditarUsuario.estado} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, estado: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
            {usuarioSelecionado.urlDocumento && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <p className="text-xs font-bold text-gray-500 px-4 py-2.5 bg-gray-50 border-b border-gray-100">📄 Documento enviado</p>
                <div className="relative w-full h-48 bg-gray-100"><Image src={usuarioSelecionado.urlDocumento} alt="Documento" fill className="object-contain" /></div>
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                  <a href={usuarioSelecionado.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Eye size={13} /> Abrir em nova aba</a>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => { setIsModalUsuarioOpen(false); setEditandoUsuario(false); }} className="flex-1 border-gray-200 text-gray-600">Fechar</Button>
              {editandoUsuario && <Button isLoading={salvandoUsuario} onClick={salvarEdicaoUsuario} className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalPromoverOpen} onClose={() => setIsModalPromoverOpen(false)} title="Promover ao Catálogo">
        <form onSubmit={confirmarPromocao} className="space-y-4 mt-2">
          <p className="text-sm text-gray-500">Revise os dados e defina o preço final antes de publicar.</p>
          <Input label="Nome Oficial" name="nome" value={formPromocao.nome} onChange={(e) => setFormPromocao({ ...formPromocao, nome: e.target.value })} required />
          <div className="flex gap-3">
            <Select label="Categoria" options={CATEGORIAS} value={formPromocao.tipo}         onChange={(e) => setFormPromocao({ ...formPromocao, tipo: e.target.value })} />
            <Select label="Unidade"   options={UNIDADES}   value={formPromocao.unidadePadrao} onChange={(e) => setFormPromocao({ ...formPromocao, unidadePadrao: e.target.value })} />
          </div>
          <Input label="Preço Final de Venda (R$)" name="preco" type="number" step="0.01" value={formPromocao.preco} onChange={(e) => setFormPromocao({ ...formPromocao, preco: e.target.value })} required placeholder="Ex: 5.90" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalPromoverOpen(false)} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
            <Button type="submit" isLoading={processando === sugestaoSelecionada?.id} className="flex-1">Publicar Produto</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isModalEditarProdutoOpen} onClose={() => setIsModalEditarProdutoOpen(false)} title="Editar Produto">
        <form onSubmit={salvarEdicaoProduto} className="space-y-4 mt-2">
          {/* Preview da foto atual + input nova foto */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Foto do Produto</label>
            <div className="flex items-center gap-4">
              {(fotoEditarProduto
                ? <img src={URL.createObjectURL(fotoEditarProduto)} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow-sm" />
                : produtoEditando?.imagemUrl
                  ? <Image src={produtoEditando.imagemUrl} alt="atual" width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                  : <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-200">Sem foto</div>
              )}
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={(e) => setFotoEditarProduto(e.target.files?.[0] || null)} className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer" />
                <p className="text-xs text-gray-400 mt-1">Deixe vazio para manter a foto atual</p>
              </div>
            </div>
          </div>
          <Input label="Nome do Produto" name="nome" value={formEditarProduto.nome} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, nome: e.target.value })} required />
          <div className="flex gap-3">
            <Select label="Categoria" options={CATEGORIAS} value={formEditarProduto.tipo}         onChange={(e) => setFormEditarProduto({ ...formEditarProduto, tipo: e.target.value })} />
            <Select label="Unidade"   options={UNIDADES}   value={formEditarProduto.unidadePadrao} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, unidadePadrao: e.target.value })} />
          </div>
          <Input label="Preço (R$)" name="preco" type="number" step="0.01" value={formEditarProduto.preco} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, preco: e.target.value })} required />
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Descrição (Opcional)</label>
            <textarea value={formEditarProduto.descricao} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, descricao: e.target.value })} placeholder="Variedade, características..." rows={3} className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalEditarProdutoOpen(false)} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
            <Button type="submit" isLoading={processando === produtoEditando?.cdProduto} className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isModalAdminOpen} onClose={() => setIsModalAdminOpen(false)} title="Criar Novo Administrador">
        <form onSubmit={criarNovoAdmin} className="space-y-4 mt-2">
          <p className="text-sm text-gray-500">O novo administrador terá acesso total ao painel. Crie uma senha segura.</p>
          <Input label="E-mail de Acesso"           type="email"    value={formAdmin.email} onChange={(e) => setFormAdmin({ ...formAdmin, email: e.target.value })} required placeholder="email@raizconecta.com.br" />
          <Input label="Senha (Mínimo 8 caracteres)" type="password" value={formAdmin.senha} onChange={(e) => setFormAdmin({ ...formAdmin, senha: e.target.value })}  required placeholder="Crie uma senha forte" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalAdminOpen(false)} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
            <Button type="submit" isLoading={criandoAdmin} className="flex-1 bg-gray-900 hover:bg-black">Criar Conta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
