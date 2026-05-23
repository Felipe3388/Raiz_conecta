"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ShieldAlert, CheckCircle, XCircle, Users, Ban, Trash2, Search, FileText,
  Loader2, RefreshCw, Package, Plus, Tag, Lightbulb
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function PainelAdmin() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Controles de Loading dos botões
  const [processando, setProcessando] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [abaAtual, setAbaAtual] = useState<"pendentes" | "gestao" | "catalogo" | "sugestoes">("pendentes");
  const [filtroBusca, setFiltroBusca] = useState("");

  const [formProduto, setFormProduto] = useState({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg" });
  const [fotoProduto, setFotoProduto] = useState<File | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resUsuarios, resProdutos, resSugestoes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usuarios`),
        fetch("/api/produtos"),
        fetch("/api/produtor/sugestao")
      ]);

      if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
      if (resProdutos.ok) setProdutos(await resProdutos.json());
      if (resSugestoes.ok) setSugestoes(await resSugestoes.json());
    } catch (error) {
      toast.error("Erro ao carregar dados do sistema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const alterarStatus = async (email: string, tipo: string, novoStatus: string) => {
    const acao = novoStatus === "SUSPENSO" ? "suspender" : novoStatus === "APROVADO" ? "aprovar/reativar" : "rejeitar";
    if (!confirm(`Tem certeza que deseja ${acao} este usuário?`)) return;

    setProcessando(email);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usuarios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo, novoStatus })
      });
      if (res.ok) {
        carregarDados();
        toast.success(`Usuário ${novoStatus.toLowerCase()} com sucesso!`);
      } else {
        toast.error("Erro ao alterar status.");
      }
    } catch (e) {
      toast.error("Falha na conexão.");
    } finally {
      setProcessando(null);
    }
  };

  const excluirUsuario = async (email: string, tipo: string) => {
    if (!confirm("⚠️ EXCLUSÃO PERMANENTE: Tem certeza que deseja apagar este usuário do banco de dados?")) return;
    setProcessando(email);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usuarios?email=${email}&tipo=${tipo}`, { method: "DELETE" });
      if (res.ok) {
        carregarDados();
        toast.success("Usuário excluído permanentemente.");
      } else {
        toast.error("Erro ao excluir. O usuário pode ter histórico no sistema.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setProcessando(null);
    }
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
    if (fotoProduto) formData.append("file", fotoProduto);

    try {
      const res = await fetch("/api/produtos", { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Produto adicionado ao catálogo!");
        setFormProduto({ nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg" });
        setFotoProduto(null);
        carregarDados();
      } else {
        toast.error("Erro ao salvar produto.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const apagarProduto = async (id: number) => {
    if (!confirm("Deletar este produto do sistema?")) return;
    try {
      const res = await fetch(`/api/produtos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        carregarDados();
        toast.info("Produto removido da vitrine.");
      } else {
        toast.error("Erro ao apagar. Pode estar em uso por um produtor.");
      }
    } catch (error) { toast.error("Erro de conexão."); }
  };

  const apagarSugestao = async (id: number) => {
    if (!confirm("Descartar esta sugestão?")) return;
    try {
      const res = await fetch(`/api/produtor/sugestao?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        carregarDados();
        toast.info("Sugestão marcada como lida e removida.");
      }
    } catch (error) { toast.error("Erro ao remover sugestão."); }
  };

  if (loading && usuarios.length === 0) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-gray-600">
      <Loader2 className="animate-spin mr-2" size={32} /> Carregando sistema...
    </div>
  );

  const pendentes = usuarios.filter((u) => u.status === "EM_ANALISE");
  const ativos = usuarios.filter((u) => u.status !== "EM_ANALISE");
  const listaGestao = ativos.filter((u) => (u.nomeFantasia || u.razaoSocial)?.toLowerCase().includes(filtroBusca.toLowerCase()) || u.email.toLowerCase().includes(filtroBusca.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex justify-between items-end border-b border-gray-200 mb-6">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            <button onClick={() => setAbaAtual("pendentes")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "pendentes" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <FileText size={18} /> Aprovações Pendentes
              {pendentes.length > 0 && (<span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs ml-1">{pendentes.length}</span>)}
            </button>
            <button onClick={() => setAbaAtual("gestao")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "gestao" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <Users size={18} /> Gestão de Usuários
            </button>
            <button onClick={() => setAbaAtual("catalogo")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "catalogo" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <Package size={18} /> Catálogo Oficial
            </button>
            <button onClick={() => setAbaAtual("sugestoes")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "sugestoes" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <Lightbulb size={18} /> Sugestões {sugestoes.length > 0 && (<span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs ml-1">{sugestoes.length}</span>)}
            </button>
          </div>
          <button onClick={carregarDados} className="text-gray-400 hover:text-gray-800 pb-3 flex items-center gap-1 text-sm font-bold">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        {/* ABA 1: PENDENTES */}
        {abaAtual === "pendentes" && (
          <div>
            {pendentes.length === 0 ? (
              <Card className="p-20 text-center bg-white border border-dashed border-gray-300 shadow-sm">
                <CheckCircle size={56} className="mx-auto mb-4 text-green-300" />
                <h2 className="text-xl font-black text-gray-700">Tudo limpo por aqui!</h2>
                <p className="text-gray-500">Não há novos cadastros aguardando aprovação.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendentes.map((user) => (
                  <Card key={user.email} className="p-6 border-amber-200 shadow-sm bg-amber-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4 border-b border-amber-100 pb-4">
                        <div>
                          <Badge variant={user.tipo === "produtor" ? "success" : "neutral"}>
                            {user.tipo === "produtor" ? "Produtor Rural" : "Mercado"}
                          </Badge>
                          <h3 className="text-xl font-bold text-gray-900 mt-2">{user.nomeFantasia || user.razaoSocial}</h3>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-6">
                        <p><strong>{user.tipoDoc || "Doc"}:</strong> {user.documento}</p>
                        <p><strong>Cidade:</strong> {user.cidade} - {user.estado}</p>
                        {user.urlDocumento && (
                          <a href={user.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1 mt-2">
                            <FileText size={16} /> Ver Foto do Documento
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => alterarStatus(user.email, user.tipo, "REJEITADO")}
                        isLoading={processando === user.email}
                        variant="outline"
                        className="w-1/2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        {!processando && <XCircle size={18} className="mr-1" />} Recusar
                      </Button>
                      <Button
                        onClick={() => alterarStatus(user.email, user.tipo, "APROVADO")}
                        isLoading={processando === user.email}
                        className="w-1/2 bg-green-600 hover:bg-green-700"
                      >
                        {!processando && <CheckCircle size={18} className="mr-1" />} Aprovar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: GESTÃO */}
        {abaAtual === "gestao" && (
          <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden px-0 md:px-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Usuários na Base de Dados</h2>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar usuário ou e-mail..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-200">Usuário</th>
                    <th className="p-4 font-bold border-b border-gray-200">Tipo</th>
                    <th className="p-4 font-bold border-b border-gray-200">Status</th>
                    <th className="p-4 font-bold border-b border-gray-200 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {listaGestao.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                  ) : (
                    listaGestao.map((user) => (
                      <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{user.nomeFantasia || user.razaoSocial}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.tipo === "produtor" ? "success" : "neutral"}>{user.tipo}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.status === "APROVADO" ? "success" : user.status === "SUSPENSO" ? "warning" : "danger"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-2 flex justify-end gap-2">
                          {user.status === "APROVADO" ? (
                            <Button onClick={() => alterarStatus(user.email, user.tipo, "SUSPENSO")} isLoading={processando === user.email} variant="outline" className="px-3 py-1.5 h-8 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50">
                              Suspender
                            </Button>
                          ) : (
                            <Button onClick={() => alterarStatus(user.email, user.tipo, "APROVADO")} isLoading={processando === user.email} variant="outline" className="px-3 py-1.5 h-8 text-xs font-bold border-green-300 text-green-700 hover:bg-green-50">
                              Reativar
                            </Button>
                          )}
                          <button onClick={() => excluirUsuario(user.email, user.tipo)} disabled={processando === user.email} className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition" title="Excluir Permanentemente">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ABA 3: CATÁLOGO DE PRODUTOS */}
        {abaAtual === "catalogo" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border border-gray-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-green-800 flex items-center gap-2 mb-4 border-b pb-2"><Plus size={20} /> Cadastrar Produto</h2>
              <form onSubmit={adicionarProduto} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Foto do Produto (Opcional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoProduto(e.target.files?.[0] || null)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm outline-none" />
                </div>
                <Input label="Nome do Produto" name="nome" type="text" value={formProduto.nome} onChange={e => setFormProduto({ ...formProduto, nome: e.target.value })} placeholder="Ex: Maçã Fuji" />
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-xs font-bold text-gray-500 block mb-1">Categoria</label>
                    <select value={formProduto.tipo} onChange={e => setFormProduto({ ...formProduto, tipo: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none">
                      <option value="Frutas">Frutas</option>
                      <option value="Verduras">Verduras</option>
                      <option value="Legumes">Legumes</option>
                      <option value="Grãos">Grãos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs font-bold text-gray-500 block mb-1">Unidade</label>
                    <select value={formProduto.unidadePadrao} onChange={e => setFormProduto({ ...formProduto, unidadePadrao: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none">
                      <option value="Kg">Kg</option>
                      <option value="Unidade">Un</option>
                      <option value="Maço">Maço</option>
                      <option value="Caixa">Caixa</option>
                    </select>
                  </div>
                </div>
                <Input label="Preço Sugerido (R$)" name="preco" type="number" step="0.01" value={formProduto.preco} onChange={e => setFormProduto({ ...formProduto, preco: e.target.value })} placeholder="0.00" />
                <Button isLoading={isSubmitting} type="submit" className="w-full h-12">Adicionar ao Catálogo</Button>
              </form>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Tag size={20} /> Vitrine Oficial ({produtos.length})</h2>
              {produtos.length === 0 ? <div className="text-center text-gray-400 py-10">Nenhum produto cadastrado no sistema ainda.</div> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {produtos.map(prod => (
                    <div key={prod.cdProduto} className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center relative group hover:border-green-400 transition-colors bg-gray-50/50">
                      <button onClick={() => apagarProduto(prod.cdProduto)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow-sm transition-opacity"><Trash2 size={16} /></button>
                      {prod.imagemUrl ? (
                        <Image src={prod.imagemUrl} alt={prod.nome} width={96} height={96} quality={80} className="w-24 h-24 object-cover rounded-full mb-3 border-4 border-white shadow-sm" />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-full mb-3 flex items-center justify-center text-gray-400 font-bold text-xs shadow-sm border-4 border-white">Sem Foto</div>
                      )}
                      <h3 className="font-bold text-gray-800 leading-tight">{prod.nome}</h3>
                      <Badge variant="neutral" className="mt-2">{prod.tipo}</Badge>
                      <p className="text-green-700 font-black mt-3 text-sm bg-green-50 px-3 py-1 rounded-lg w-full">R$ {Number(prod.preco).toFixed(2)} <span className="text-gray-500 font-normal">/ {prod.unidadePadrao}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ABA 4: SUGESTÕES DE PRODUTOS */}
        {abaAtual === "sugestoes" && (
          <div className="space-y-6">
            {sugestoes.length === 0 ? (
              <Card className="p-20 text-center bg-white border border-dashed border-gray-300 shadow-sm">
                <Lightbulb size={56} className="mx-auto mb-4 text-amber-300" />
                <h2 className="text-xl font-black text-gray-700">Tudo lido!</h2>
                <p className="text-gray-500">Nenhuma sugestão nova dos produtores no momento.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sugestoes.map((sug) => (
                  <Card key={sug.id} className="p-6 border-amber-200 bg-amber-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4 border-b border-amber-100 pb-4">
                        <div>
                          <Badge variant="warning">Nova Ideia</Badge>
                          <h3 className="text-xl font-bold text-gray-900 mt-2">{sug.nomeProduto}</h3>
                          <p className="text-xs text-gray-500">Enviado por: {sug.emailProdutor}</p>
                        </div>
                      </div>

                      {sug.imagemUrl && (
                        <div className="w-full h-32 relative mb-4 rounded-lg overflow-hidden border border-gray-200">
                          <Image src={sug.imagemUrl} alt="Sugestão" layout="fill" objectFit="cover" />
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-700 mb-6 italic">
                        "{sug.descricao || 'Nenhuma descrição detalhada.'}"
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={() => apagarSugestao(sug.id)} variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-100 h-10">
                        <CheckCircle size={18} className="mr-2" /> Marcar como Lido / Descartar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}