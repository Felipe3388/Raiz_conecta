"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Users, Trash2, Search, FileText,
  Loader2, RefreshCw, Package, Plus, Tag, Lightbulb,
  ShieldPlus, LayoutDashboard, TrendingUp, Activity, Store, Leaf,
  ArrowUpRight, Edit2, Eye, UserCog, ChevronDown, ChevronUp
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function PainelAdmin() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [processando, setProcessando] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modais Admin
  const [isModalAdminOpen, setIsModalAdminOpen] = useState(false);
  const [criandoAdmin, setCriandoAdmin] = useState(false);
  const [formAdmin, setFormAdmin] = useState({ email: "", senha: "" });

  const [abaAtual, setAbaAtual] = useState<"dashboard" | "pendentes" | "gestao" | "catalogo" | "sugestoes">("dashboard");
  const [filtroBusca, setFiltroBusca] = useState("");

  const [formProduto, setFormProduto] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" });
  const [fotoProduto, setFotoProduto] = useState<File | null>(null);

  // Produtos expandidos (ver mais / recolher)
  const [produtosExpandidos, setProdutosExpandidos] = useState<Set<number>>(new Set());

  // Modal de confirmação genérico (sem textarea)
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirmar",
    variant: "warning" as "danger" | "warning" | "success" | "info",
    onConfirm: () => {},
  });
  const fecharConfirmacao = () => setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

  // Modal de ação COM motivo (suspensão / exclusão)
  const [modalMotivo, setModalMotivo] = useState({
    isOpen: false,
    title: "",
    descricao: "",
    confirmLabel: "Confirmar",
    variant: "warning" as "danger" | "warning",
    motivo: "",
    onConfirm: (motivo: string) => {},
  });
  const fecharModalMotivo = () => setModalMotivo((p) => ({ ...p, isOpen: false, motivo: "" }));

  // Modal promoção de sugestão
  const [isModalPromoverOpen, setIsModalPromoverOpen] = useState(false);
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<any>(null);
  const [formPromocao, setFormPromocao] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg" });

  // Modal editar produto (SCRUM-138)
  const [isModalEditarProdutoOpen, setIsModalEditarProdutoOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [formEditarProduto, setFormEditarProduto] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" });

  // Modal visualizar / editar usuário
  const [isModalUsuarioOpen, setIsModalUsuarioOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);
  const [editandoUsuario, setEditandoUsuario] = useState(false);
  const [formEditarUsuario, setFormEditarUsuario] = useState({ nomeFantasia: "", telefone: "", cidade: "", estado: "" });
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  // ── Carregamento de dados ─────────────────────────────────────────
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resUsuarios, resProdutos, resSugestoes] = await Promise.all([
        fetch("/api/admin/usuarios"), fetch("/api/produtos"), fetch("/api/produtor/sugestao"),
      ]);
      if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
      if (resProdutos.ok) setProdutos(await resProdutos.json());
      if (resSugestoes.ok) setSugestoes(await resSugestoes.json());
    } catch { toast.error("Erro ao carregar dados do sistema."); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const toggleProdutoExpandido = (id: number) => {
    setProdutosExpandidos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Ações de usuário ─────────────────────────────────────────────

  /** Aprovar / Reativar — sem motivo */
  const alterarStatusSimples = (email: string, tipo: string, novoStatus: string) => {
    const label = novoStatus === "APROVADO" ? "Aprovar / Reativar" : "Rejeitar";
    const variant = novoStatus === "APROVADO" ? "success" : "danger";
    setConfirmConfig({
      isOpen: true,
      title: `${label} Usuário`,
      description: `Tem certeza que deseja ${novoStatus === "APROVADO" ? "aprovar/reativar" : "rejeitar"} este usuário?`,
      confirmLabel: "Sim, confirmar",
      variant: variant as any,
      onConfirm: async () => {
        setProcessando(email);
        try {
          const res = await fetch("/api/admin/usuarios", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, tipo, novoStatus }),
          });
          if (res.ok) { carregarDados(); toast.success(`Usuário ${novoStatus.toLowerCase()} com sucesso!`); }
        } catch { toast.error("Falha na conexão."); }
        finally { setProcessando(null); fecharConfirmacao(); }
      },
    });
  };

  /** Suspender — com motivo */
  const suspenderUsuario = (email: string, tipo: string) => {
    setModalMotivo({
      isOpen: true,
      title: "Suspender Usuário",
      descricao: "Informe o motivo da suspensão. Ele será enviado por e-mail ao usuário.",
      confirmLabel: "Suspender Conta",
      variant: "warning",
      motivo: "",
      onConfirm: async (motivo) => {
        setProcessando(email);
        try {
          const res = await fetch("/api/admin/usuarios", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, tipo, novoStatus: "SUSPENSO", motivo }),
          });
          if (res.ok) { carregarDados(); toast.success("Usuário suspenso. E-mail enviado."); }
        } catch { toast.error("Falha na conexão."); }
        finally { setProcessando(null); fecharModalMotivo(); }
      },
    });
  };

  /** Excluir — com motivo */
  const excluirUsuario = (email: string, tipo: string) => {
    setModalMotivo({
      isOpen: true,
      title: "Exclusão Permanente",
      descricao: "⚠️ Esta ação não pode ser desfeita. Informe o motivo — ele será enviado por e-mail ao usuário antes da exclusão.",
      confirmLabel: "Excluir Permanentemente",
      variant: "danger",
      motivo: "",
      onConfirm: async (motivo) => {
        setProcessando(email);
        try {
          const params = new URLSearchParams({ email, tipo, motivo });
          const res = await fetch(`/api/admin/usuarios?${params}`, { method: "DELETE" });
          if (res.ok) { carregarDados(); toast.success("Usuário excluído permanentemente."); }
        } catch { toast.error("Erro de conexão."); }
        finally { setProcessando(null); fecharModalMotivo(); }
      },
    });
  };

  // ── Visualizar / Editar usuário ───────────────────────────────────
  const abrirModalUsuario = (user: any) => {
    setUsuarioSelecionado(user);
    setFormEditarUsuario({
      nomeFantasia: user.nomeFantasia || user.razaoSocial || "",
      telefone: user.telefone || "",
      cidade: user.cidade || "",
      estado: user.estado || "",
    });
    setEditandoUsuario(false);
    setIsModalUsuarioOpen(true);
  };

  const salvarEdicaoUsuario = async () => {
    setSalvandoUsuario(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: usuarioSelecionado.email, tipo: usuarioSelecionado.tipo, ...formEditarUsuario }),
      });
      if (res.ok) {
        carregarDados();
        setEditandoUsuario(false);
        toast.success("Dados do usuário atualizados.");
      } else {
        toast.error("Erro ao atualizar usuário.");
      }
    } catch { toast.error("Erro de conexão."); }
    finally { setSalvandoUsuario(false); }
  };

  // ── Produtos ──────────────────────────────────────────────────────
  const apagarProduto = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remover Produto",
      description: "Deletar este produto do sistema de catálogo oficial?",
      confirmLabel: "Deletar Produto",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/produtos?id=${id}`, { method: "DELETE" });
          if (res.ok) { carregarDados(); toast.info("Produto removido da vitrine."); }
        } catch { toast.error("Erro de conexão."); }
        finally { fecharConfirmacao(); }
      },
    });
  };

  const apagarSugestao = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: "Descartar Sugestão",
      description: "Tem certeza que deseja apagar esta sugestão? O produtor não será notificado.",
      confirmLabel: "Descartar",
      variant: "danger",
      onConfirm: async () => {
        setProcessando(id);
        try {
          const res = await fetch(`/api/produtor/sugestao?id=${id}`, { method: "DELETE" });
          if (res.ok) { carregarDados(); toast.info("Sugestão removida."); }
        } catch { toast.error("Erro ao remover sugestão."); }
        finally { setProcessando(null); fecharConfirmacao(); }
      },
    });
  };

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
      const res = await fetch("/api/admin/promover-sugestao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idSugestao: sugestaoSelecionada.id, ...formPromocao }),
      });
      if (res.ok) { carregarDados(); setIsModalPromoverOpen(false); toast.success("Produto adicionado ao catálogo!"); }
      else toast.error("Erro ao promover a sugestão.");
    } catch { toast.error("Erro de conexão."); }
    finally { setProcessando(null); }
  };

  const abrirModalEditarProduto = (prod: any) => {
    setProdutoEditando(prod);
    setFormEditarProduto({ nome: prod.nome, tipo: prod.tipo, preco: String(prod.preco), unidadePadrao: prod.unidadePadrao, descricao: prod.descricao || "" });
    setIsModalEditarProdutoOpen(true);
  };

  const salvarEdicaoProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEditarProduto.preco || !formEditarProduto.nome) return toast.warning("Preencha o nome e o preço.");
    setProcessando(produtoEditando.cdProduto);
    try {
      const res = await fetch("/api/produtos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: produtoEditando.cdProduto, ...formEditarProduto }),
      });
      if (res.ok) { carregarDados(); setIsModalEditarProdutoOpen(false); toast.success("Produto atualizado com sucesso!"); }
      else toast.error("Erro ao atualizar o produto.");
    } catch { toast.error("Erro de conexão com o servidor."); }
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
    } catch { toast.error("Erro de conexão com o servidor."); }
    finally { setCriandoAdmin(false); }
  };

  const adicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduto.nome || !formProduto.preco) return toast.warning("Preencha o nome e preço");
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nome", formProduto.nome);
    formData.append("tipo", formProduto.tipo);
    formData.append("preco", formProduto.preco);
    formData.append("unidadePadrao", formProduto.unidadePadrao);
    formData.append("descricao", formProduto.descricao);
    if (fotoProduto) formData.append("file", fotoProduto);
    try {
      const res = await fetch("/api/produtos", { method: "POST", body: formData });
      if (res.ok) { toast.success("Produto adicionado!"); setFormProduto({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" }); setFotoProduto(null); carregarDados(); }
      else toast.error("Erro ao salvar produto.");
    } catch { toast.error("Erro de conexão."); }
    finally { setIsSubmitting(false); }
  };

  if (loading && usuarios.length === 0)
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-600"><Loader2 className="animate-spin mr-2" size={32} /> Carregando sistema...</div>;

  const pendentes = usuarios.filter((u) => u.status === "EM_ANALISE");
  const ativos = usuarios.filter((u) => u.status !== "EM_ANALISE");
  const listaGestao = ativos.filter((u) =>
    (u.nomeFantasia || u.razaoSocial)?.toLowerCase().includes(filtroBusca.toLowerCase()) ||
    u.email.toLowerCase().includes(filtroBusca.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">

        {/* NAVEGAÇÃO */}
        <div className="flex justify-between items-end border-b border-gray-200 mb-6">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard size={18} />, color: "purple" },
              { id: "pendentes", label: "Aprovações Pendentes", icon: <FileText size={18} />, color: "amber", badge: pendentes.length },
              { id: "gestao", label: "Gestão de Usuários", icon: <Users size={18} />, color: "blue" },
              { id: "catalogo", label: "Catálogo Oficial", icon: <Package size={18} />, color: "green" },
              { id: "sugestoes", label: "Sugestões", icon: <Lightbulb size={18} />, color: "amber", badge: sugestoes.length },
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtual(aba.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  abaAtual === aba.id
                    ? `border-${aba.color}-${aba.color === "blue" ? "600" : "500"} text-${aba.color}-${aba.color === "blue" ? "700" : "600"}`
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {aba.icon} {aba.label}
                {aba.badge !== undefined && aba.badge > 0 && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs ml-1">{aba.badge}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={carregarDados} className="text-gray-400 hover:text-gray-800 pb-3 flex items-center gap-1 text-sm font-bold">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        {/* ABA: VISÃO GERAL */}
        {abaAtual === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm flex items-center justify-between"><div><p className="text-sm font-bold text-gray-500 uppercase">Total de Usuários</p><h3 className="text-3xl font-black text-gray-800 mt-1">{usuarios.length}</h3></div><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm flex items-center justify-between"><div><p className="text-sm font-bold text-gray-500 uppercase">Produtores Ativos</p><h3 className="text-3xl font-black text-gray-800 mt-1">{usuarios.filter((u) => u.tipo === "produtor" && u.status === "APROVADO").length}</h3></div><div className="p-3 bg-green-50 text-green-600 rounded-xl"><Leaf size={24} /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-orange-500 shadow-sm flex items-center justify-between"><div><p className="text-sm font-bold text-gray-500 uppercase">Mercados Ativos</p><h3 className="text-3xl font-black text-gray-800 mt-1">{usuarios.filter((u) => u.tipo === "mercado" && u.status === "APROVADO").length}</h3></div><div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Store size={24} /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-purple-500 shadow-sm flex items-center justify-between"><div><p className="text-sm font-bold text-gray-500 uppercase">Produtos no Catálogo</p><h3 className="text-3xl font-black text-gray-800 mt-1">{produtos.length}</h3></div><div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Package size={24} /></div></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white shadow-sm border border-gray-200"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4"><Activity size={20} className="text-red-500" /> Resumo de Operações</h3><div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium text-gray-600">Aprovações Pendentes</span><Badge variant={pendentes.length > 0 ? "warning" : "success"}>{pendentes.length} contas</Badge></div><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium text-gray-600">Contas Suspensas</span><Badge variant="danger">{usuarios.filter((u) => u.status === "SUSPENSO").length} contas</Badge></div><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium text-gray-600">Novas Sugestões</span><Badge variant="neutral">{sugestoes.length} lidas</Badge></div></div></Card>
              <Card className="p-6 bg-white shadow-sm border border-gray-200"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4"><TrendingUp size={20} className="text-blue-500" /> Últimos Cadastrados</h3><div className="space-y-3">{usuarios.slice(-4).reverse().map((u, i) => (<div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"><div><p className="font-bold text-sm text-gray-800">{u.nomeFantasia || u.razaoSocial || "Usuário Sem Nome"}</p><p className="text-xs text-gray-500">{u.email}</p></div><Badge variant={u.tipo === "produtor" ? "success" : u.tipo === "admin" ? "warning" : "neutral"}>{u.tipo}</Badge></div>))}</div></Card>
            </div>
          </div>
        )}

        {/* ABA: PENDENTES */}
        {abaAtual === "pendentes" && (
          <div>
            {pendentes.length === 0 ? (
              <Card className="p-20 text-center bg-white border border-dashed border-gray-300 shadow-sm"><CheckCircle size={56} className="mx-auto mb-4 text-green-300" /><h2 className="text-xl font-black text-gray-700">Tudo limpo por aqui!</h2><p className="text-gray-500">Não há novos cadastros aguardando aprovação.</p></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendentes.map((user) => (
                  <Card key={user.email} className="p-6 border-amber-200 shadow-sm bg-amber-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4 border-b border-amber-100 pb-4">
                        <div>
                          <Badge variant={user.tipo === "produtor" ? "success" : "neutral"} className="mb-2 inline-block">{user.tipo === "produtor" ? "Produtor Rural" : "Mercado"}</Badge>
                          <h3 className="text-xl font-bold text-gray-900">{user.nomeFantasia || user.razaoSocial}</h3>
                          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-6">
                        <p><strong>{user.tipoDoc || "Doc"}:</strong> {user.documento}</p>
                        <p><strong>Cidade:</strong> {user.cidade} - {user.estado}</p>
                        {user.urlDocumento && (
                          <a href={user.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1 mt-2">
                            <FileText size={16} /> Ver Documento
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                      <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "REJEITADO")} isLoading={processando === user.email} variant="outline" className="w-1/2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-11"><XCircle size={18} className="mr-1" /> Recusar</Button>
                      <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "APROVADO")} isLoading={processando === user.email} className="w-1/2 bg-green-600 hover:bg-green-700 h-11"><CheckCircle size={18} className="mr-1" /> Aprovar</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: GESTÃO */}
        {abaAtual === "gestao" && (
          <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden px-0 md:px-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 ml-2">Usuários na Base de Dados</h2>
              <div className="flex w-full md:w-auto items-center gap-4">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Buscar usuário ou e-mail..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <Button onClick={() => setIsModalAdminOpen(true)} className="whitespace-nowrap bg-gray-900 hover:bg-black text-white"><ShieldPlus size={18} className="mr-2" /> Novo Admin</Button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-150">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6 font-bold border-b border-gray-200">Usuário</th>
                    <th className="p-4 font-bold border-b border-gray-200">Tipo</th>
                    <th className="p-4 font-bold border-b border-gray-200">Status</th>
                    <th className="p-4 pr-6 font-bold border-b border-gray-200 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {listaGestao.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                  ) : (
                    listaGestao.map((user) => (
                      <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-gray-900">{user.nomeFantasia || user.razaoSocial}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="p-4"><Badge variant={user.tipo === "produtor" ? "success" : user.tipo === "admin" ? "warning" : "neutral"}>{user.tipo.toUpperCase()}</Badge></td>
                        <td className="p-4"><Badge variant={user.status === "APROVADO" ? "success" : user.status === "SUSPENSO" ? "warning" : "danger"}>{user.status}</Badge></td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Ver / Editar usuário */}
                            <button
                              onClick={() => abrirModalUsuario(user)}
                              className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                              title="Ver / Editar Usuário"
                            >
                              <UserCog size={15} className="mr-1" /> Detalhes
                            </button>

                            {user.tipo !== "admin" && (
                              user.status === "APROVADO" ? (
                                <Button onClick={() => suspenderUsuario(user.email, user.tipo)} isLoading={processando === user.email} variant="outline" className="px-3 py-1.5 h-8 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50">Suspender</Button>
                              ) : (
                                <Button onClick={() => alterarStatusSimples(user.email, user.tipo, "APROVADO")} isLoading={processando === user.email} variant="outline" className="px-3 py-1.5 h-8 text-xs font-bold border-green-300 text-green-700 hover:bg-green-50">Reativar</Button>
                              )
                            )}

                            <button
                              onClick={() => excluirUsuario(user.email, user.tipo)}
                              disabled={processando === user.email}
                              className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ABA: CATÁLOGO */}
        {abaAtual === "catalogo" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form cadastrar produto */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-green-800 flex items-center gap-2 mb-4 border-b pb-2"><Plus size={20} /> Cadastrar Produto</h2>
              <form onSubmit={adicionarProduto} className="space-y-4">
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Foto (Opcional)</label><input type="file" accept="image/*" onChange={(e) => setFotoProduto(e.target.files?.[0] || null)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm outline-none" /></div>
                <Input label="Nome do Produto" name="nome" type="text" value={formProduto.nome} onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })} placeholder="Ex: Maçã Fuji" />
                <div className="flex gap-4">
                  <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Categoria</label><select value={formProduto.tipo} onChange={(e) => setFormProduto({ ...formProduto, tipo: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none"><option value="Frutas">Frutas</option><option value="Verduras">Verduras</option><option value="Legumes">Legumes</option><option value="Grãos">Grãos</option><option value="Outros">Outros</option></select></div>
                  <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Unidade</label><select value={formProduto.unidadePadrao} onChange={(e) => setFormProduto({ ...formProduto, unidadePadrao: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none"><option value="Kg">Kg</option><option value="Unidade">Un</option><option value="Maço">Maço</option><option value="Caixa">Caixa</option></select></div>
                </div>
                <Input label="Preço Sugerido (R$)" name="preco" type="number" step="0.01" value={formProduto.preco} onChange={(e) => setFormProduto({ ...formProduto, preco: e.target.value })} placeholder="Ex: 5.90" />
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Descrição (Opcional)</label>
                  <textarea
                    value={formProduto.descricao}
                    onChange={(e) => setFormProduto({ ...formProduto, descricao: e.target.value })}
                    placeholder="Descreva o produto, variedade, características..."
                    rows={3}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <Button isLoading={isSubmitting} type="submit" className="w-full h-12">Adicionar ao Catálogo</Button>
              </form>
            </Card>

            {/* Grid de produtos */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Tag size={20} /> Vitrine Oficial ({produtos.length})</h2>
              {produtos.length === 0 ? (
                <div className="text-center text-gray-400 py-10">Nenhum produto cadastrado no sistema ainda.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {produtos.map((prod) => {
                    const expandido = produtosExpandidos.has(prod.cdProduto);
                    return (
                      <div key={prod.cdProduto} className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center relative group hover:border-green-400 transition-colors bg-gray-50/50">
                        {/* Botões editar / deletar */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                          <button onClick={() => abrirModalEditarProduto(prod)} className="bg-white text-blue-500 hover:text-blue-700 rounded-full p-1.5 shadow-sm transition-colors" title="Editar Produto"><Edit2 size={15} /></button>
                          <button onClick={() => apagarProduto(prod.cdProduto)} className="bg-white text-gray-300 hover:text-red-500 rounded-full p-1.5 shadow-sm transition-colors" title="Excluir Produto"><Trash2 size={15} /></button>
                        </div>

                        {prod.imagemUrl ? (
                          <Image src={prod.imagemUrl} alt={prod.nome} width={96} height={96} className="w-24 h-24 object-cover rounded-full mb-3 border-4 border-white shadow-sm" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-full mb-3 flex items-center justify-center text-gray-400 font-bold text-xs shadow-sm border-4 border-white">Sem Foto</div>
                        )}

                        <h3 className="font-bold text-gray-800 leading-tight">{prod.nome}</h3>
                        <Badge variant="neutral" className="mt-2">{prod.tipo}</Badge>
                        <p className="text-green-700 font-black mt-3 text-sm bg-green-50 px-3 py-1 rounded-lg w-full">
                          R$ {Number(prod.preco).toFixed(2)} <span className="text-gray-500 font-normal">/ {prod.unidadePadrao}</span>
                        </p>

                        {/* Ver mais / recolher descrição */}
                        {prod.descricao && (
                          <button
                            onClick={() => toggleProdutoExpandido(prod.cdProduto)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
                          >
                            {expandido ? <><ChevronUp size={13} /> Recolher</> : <><ChevronDown size={13} /> Ver mais</>}
                          </button>
                        )}
                        {expandido && prod.descricao && (
                          <p className="mt-2 text-xs text-gray-600 bg-gray-100 rounded-lg p-2 w-full text-left leading-relaxed">
                            {prod.descricao}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ABA: SUGESTÕES */}
        {abaAtual === "sugestoes" && (
          <div className="space-y-6">
            {sugestoes.length === 0 ? (
              <Card className="p-20 text-center bg-white border border-dashed border-gray-300 shadow-sm"><Lightbulb size={56} className="mx-auto mb-4 text-amber-300" /><h2 className="text-xl font-black text-gray-700">Tudo lido!</h2><p className="text-gray-500">Nenhuma sugestão nova dos produtores no momento.</p></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sugestoes.map((sug) => (
                  <Card key={sug.id} className="p-6 bg-white shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                      <div className="mb-4 border-b border-gray-100 pb-4">
                        <Badge variant="warning" className="mb-2 inline-block">Nova Ideia</Badge>
                        <h3 className="text-xl font-bold text-gray-900">{sug.nomeProduto}</h3>
                        <p className="text-xs text-gray-500 mt-1">Enviado por: {sug.emailProdutor}</p>
                      </div>
                      {sug.imagemUrl && (
                        <div className="w-full aspect-square relative mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                          <Image src={sug.imagemUrl} alt="Sugestão" layout="fill" objectFit="cover" />
                        </div>
                      )}
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-sm text-gray-700 mb-6 italic shadow-sm flex flex-col gap-2">
                        <span>"{sug.descricao || "Nenhuma descrição detalhada."}"</span>
                        {sug.precoSugerido && (
                          <span className="font-bold text-green-700">Preço Sugerido: R$ {Number(sug.precoSugerido).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto">
                      <Button onClick={() => abrirModalPromover(sug)} isLoading={processando === sug.id} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold shadow-md text-white">
                        <ArrowUpRight size={18} className="mr-2" /> Revisar e Promover
                      </Button>
                      <Button onClick={() => apagarSugestao(sug.id)} disabled={processando === sug.id} variant="outline" className="w-full border-transparent text-gray-500 hover:bg-red-50 hover:text-red-600 h-10 text-xs font-bold">
                        <Trash2 size={16} className="mr-2" /> Descartar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════ */}
      {/*         MODAIS GLOBAIS         */}
      {/* ═══════════════════════════════ */}

      {/* Confirm simples */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={fecharConfirmacao}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        isLoading={processando !== null}
      />

      {/* Modal COM motivo (suspensão / exclusão) */}
      <Modal isOpen={modalMotivo.isOpen} onClose={fecharModalMotivo} title={modalMotivo.title}>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-gray-600 leading-relaxed">{modalMotivo.descricao}</p>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Motivo <span className="text-red-500">*</span></label>
            <textarea
              value={modalMotivo.motivo}
              onChange={(e) => setModalMotivo((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Descreva o motivo de forma clara para o usuário..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={fecharModalMotivo} className="w-1/2 border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</Button>
            <Button
              type="button"
              isLoading={processando !== null}
              onClick={() => modalMotivo.onConfirm(modalMotivo.motivo)}
              className={`w-1/2 text-white shadow-md ${modalMotivo.variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}
              disabled={!modalMotivo.motivo.trim()}
            >
              {modalMotivo.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal visualizar / editar usuário */}
      <Modal isOpen={isModalUsuarioOpen} onClose={() => setIsModalUsuarioOpen(false)} title="Detalhes do Usuário">
        {usuarioSelecionado && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={usuarioSelecionado.tipo === "produtor" ? "success" : usuarioSelecionado.tipo === "admin" ? "warning" : "neutral"} className="mb-1">{usuarioSelecionado.tipo.toUpperCase()}</Badge>
                <Badge variant={usuarioSelecionado.status === "APROVADO" ? "success" : usuarioSelecionado.status === "SUSPENSO" ? "warning" : "danger"} className="mb-1 ml-2">{usuarioSelecionado.status}</Badge>
              </div>
              {!editandoUsuario && usuarioSelecionado.tipo !== "admin" && (
                <button onClick={() => setEditandoUsuario(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  <Edit2 size={14} /> Editar dados
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="font-bold text-gray-500">E-mail:</span> <span className="text-gray-800">{usuarioSelecionado.email}</span></p>
              {!editandoUsuario ? (
                <>
                  <p><span className="font-bold text-gray-500">Nome:</span> <span className="text-gray-800">{usuarioSelecionado.nomeFantasia || usuarioSelecionado.razaoSocial || "—"}</span></p>
                  <p><span className="font-bold text-gray-500">Telefone:</span> <span className="text-gray-800">{usuarioSelecionado.telefone || "—"}</span></p>
                  <p><span className="font-bold text-gray-500">Cidade/Estado:</span> <span className="text-gray-800">{usuarioSelecionado.cidade || "—"} / {usuarioSelecionado.estado || "—"}</span></p>
                  <p><span className="font-bold text-gray-500">Documento:</span> <span className="text-gray-800">{usuarioSelecionado.tipoDoc || "Doc"}: {usuarioSelecionado.documento || "—"}</span></p>
                </>
              ) : (
                <div className="space-y-3 pt-1">
                  <Input label="Nome / Razão Social" value={formEditarUsuario.nomeFantasia} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, nomeFantasia: e.target.value })} />
                  <Input label="Telefone" value={formEditarUsuario.telefone} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, telefone: e.target.value })} />
                  <div className="flex gap-3">
                    <Input label="Cidade" value={formEditarUsuario.cidade} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, cidade: e.target.value })} />
                    <Input label="Estado (UF)" value={formEditarUsuario.estado} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, estado: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            {/* Documento */}
            {usuarioSelecionado.urlDocumento && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <p className="text-xs font-bold text-gray-500 px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200">📄 Documento enviado</p>
                <div className="relative w-full h-48 bg-gray-100">
                  <Image src={usuarioSelecionado.urlDocumento} alt="Documento" fill className="object-contain" />
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <a href={usuarioSelecionado.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Eye size={13} /> Abrir em nova aba
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsModalUsuarioOpen(false); setEditandoUsuario(false); }} className="w-1/2 border-gray-300 text-gray-600">Fechar</Button>
              {editandoUsuario && (
                <Button type="button" isLoading={salvandoUsuario} onClick={salvarEdicaoUsuario} className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white">Salvar Alterações</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal promover sugestão */}
      <Modal isOpen={isModalPromoverOpen} onClose={() => setIsModalPromoverOpen(false)} title="Promover ao Catálogo">
        <form onSubmit={confirmarPromocao} className="space-y-4 mt-2">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">Revise os dados e defina o preço final antes de publicar.</p>
          <Input label="Nome Oficial do Produto" name="nome" type="text" value={formPromocao.nome} onChange={(e) => setFormPromocao({ ...formPromocao, nome: e.target.value })} required />
          <div className="flex gap-4">
            <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Categoria</label><select value={formPromocao.tipo} onChange={(e) => setFormPromocao({ ...formPromocao, tipo: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none"><option value="Frutas">Frutas</option><option value="Verduras">Verduras</option><option value="Legumes">Legumes</option><option value="Grãos">Grãos</option><option value="Outros">Outros</option></select></div>
            <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Unidade</label><select value={formPromocao.unidadePadrao} onChange={(e) => setFormPromocao({ ...formPromocao, unidadePadrao: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none"><option value="Kg">Kg</option><option value="Unidade">Un</option><option value="Maço">Maço</option><option value="Caixa">Caixa</option></select></div>
          </div>
          <Input label="Preço Final de Venda (R$)" name="preco" type="number" step="0.01" value={formPromocao.preco} onChange={(e) => setFormPromocao({ ...formPromocao, preco: e.target.value })} required placeholder="Ex: 5.90" />
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalPromoverOpen(false)} className="w-1/2 border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</Button>
            <Button type="submit" isLoading={processando === sugestaoSelecionada?.id} className="w-1/2 bg-green-600 hover:bg-green-700 text-white shadow-md">Publicar Produto</Button>
          </div>
        </form>
      </Modal>

      {/* Modal editar produto */}
      <Modal isOpen={isModalEditarProdutoOpen} onClose={() => setIsModalEditarProdutoOpen(false)} title="Editar Produto">
        <form onSubmit={salvarEdicaoProduto} className="space-y-4 mt-2">
          <Input label="Nome do Produto" name="nome" type="text" value={formEditarProduto.nome} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, nome: e.target.value })} required />
          <div className="flex gap-4">
            <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Categoria</label><select value={formEditarProduto.tipo} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, tipo: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none"><option value="Frutas">Frutas</option><option value="Verduras">Verduras</option><option value="Legumes">Legumes</option><option value="Grãos">Grãos</option><option value="Outros">Outros</option></select></div>
            <div className="w-1/2"><label className="text-xs font-bold text-gray-500 block mb-1">Unidade</label><select value={formEditarProduto.unidadePadrao} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, unidadePadrao: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none"><option value="Kg">Kg</option><option value="Unidade">Un</option><option value="Maço">Maço</option><option value="Caixa">Caixa</option></select></div>
          </div>
          <Input label="Preço (R$)" name="preco" type="number" step="0.01" value={formEditarProduto.preco} onChange={(e) => setFormEditarProduto({ ...formEditarProduto, preco: e.target.value })} required />
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Descrição (Opcional)</label>
            <textarea
              value={formEditarProduto.descricao}
              onChange={(e) => setFormEditarProduto({ ...formEditarProduto, descricao: e.target.value })}
              placeholder="Descreva o produto, variedade, características..."
              rows={3}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalEditarProdutoOpen(false)} className="w-1/2 border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</Button>
            <Button type="submit" isLoading={processando === produtoEditando?.cdProduto} className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Modal novo admin */}
      <Modal isOpen={isModalAdminOpen} onClose={() => setIsModalAdminOpen(false)} title="Criar Novo Administrador">
        <form onSubmit={criarNovoAdmin} className="space-y-4 mt-2">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">O novo administrador terá acesso total ao painel. Crie uma senha forte e segura.</p>
          <Input label="E-mail de Acesso" type="email" value={formAdmin.email} onChange={(e) => setFormAdmin({ ...formAdmin, email: e.target.value })} required placeholder="email@raizconecta.com.br" />
          <Input label="Senha (Mínimo 8 caracteres)" type="password" value={formAdmin.senha} onChange={(e) => setFormAdmin({ ...formAdmin, senha: e.target.value })} required placeholder="Crie uma senha forte" />
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalAdminOpen(false)} className="w-1/2 border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</Button>
            <Button type="submit" isLoading={criandoAdmin} className="w-1/2 bg-gray-900 hover:bg-black text-white">Criar Conta</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
