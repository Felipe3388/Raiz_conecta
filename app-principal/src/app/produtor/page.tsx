/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle, Filter, Sprout, Save, MessageSquarePlus,
  ListChecks, LayoutDashboard, XCircle
} from "lucide-react";

import { Card }          from "@/components/ui/Card";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { Badge }         from "@/components/ui/Badge";
import { Modal }         from "@/components/ui/Modal";
import { TabNav }        from "@/components/ui/TabNav";
import { SearchBar }     from "@/components/ui/SearchBar";
import { EmptyState }    from "@/components/ui/EmptyState";
import { ProgressBar }   from "@/components/ui/ProgressBar";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { PageLoader }    from "@/components/ui/PageLoader";
import { StatusBanner }  from "@/components/ui/StatusBanner";

interface Oferta { quantidade: number; emailProdutor: string; }
interface Demanda { id: string; produto: string; quantidade: number; unidade: string; precoMedio: number; status: string; ofertas: Oferta[]; emailMercado: string; criadoEm: string; }
interface PerfilProdutor { email: string; nomeFantasia: string; status: string; }
interface ProdutoCatalogo { cdProduto: number; nome: string; tipo: string; imagemUrl: string; unidadePadrao: string; }

export default function PainelProdutor() {
  const router = useRouter();
  const [produtor, setProdutor] = useState<PerfilProdutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [demandasAbertas, setDemandasAbertas] = useState<Demanda[]>([]);
  const [catalogoOficial, setCatalogoOficial] = useState<ProdutoCatalogo[]>([]);
  const [meusProdutosIds, setMeusProdutosIds] = useState<number[]>([]);
  const [inputsOferta, setInputsOferta] = useState<{ [key: string]: number }>({});
  const [enviando, setEnviando] = useState(false);
  const [salvandoCatalogo, setSalvandoCatalogo] = useState(false);
  const [abaAtual, setAbaAtual] = useState("mural");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [modalSugestaoOpen, setModalSugestaoOpen] = useState(false);
  const [formSugestao, setFormSugestao] = useState({ nome: "", descricao: "", precoSugerido: "" });
  const [fotoSugestao, setFotoSugestao] = useState<File | null>(null);

  useEffect(() => {
    async function carregarDados() {
      const emailLogado = localStorage.getItem("userEmail");
      if (!emailLogado) return router.push("/login");
      try {
        const resPerfil = await fetch(`/api/vendedor/perfil?email=${emailLogado}`);
        if (resPerfil.ok) {
          const dadosPerfil = await resPerfil.json();
          if (!dadosPerfil) return router.push("/completar-perfil");
          setProdutor(dadosPerfil);
          if (dadosPerfil.status === "APROVADO") {
            const [resDemandas, resCatalogo, resMeusIds] = await Promise.all([
              fetch("/api/mercado/demandas"),
              fetch("/api/produtos"),
              fetch(`/api/produtor/meus-produtos?email=${emailLogado}`),
            ]);
            if (resDemandas.ok) setDemandasAbertas(await resDemandas.json());
            if (resCatalogo.ok) setCatalogoOficial(await resCatalogo.json());
            if (resMeusIds.ok) setMeusProdutosIds(await resMeusIds.json());
          }
        } else { router.push("/completar-perfil"); }
      } catch { toast.error("Erro ao carregar os dados."); }
      finally { setLoading(false); }
    }
    carregarDados();
  }, [router]);

  const toggleProduto = (id: number) =>
    setMeusProdutosIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  const salvarMeuCatalogo = async () => {
    setSalvandoCatalogo(true);
    try {
      const res = await fetch("/api/produtor/meus-produtos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: produtor?.email, produtosIds: meusProdutosIds }),
      });
      if (res.ok) toast.success("Catálogo salvo!", { description: "O Mural de Oportunidades foi atualizado." });
      else toast.error("Erro ao salvar catálogo.");
    } catch { toast.error("Erro de conexão."); }
    finally { setSalvandoCatalogo(false); }
  };

  const enviarSugestao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSugestao.nome) return toast.warning("Dê um nome ao produto.");
    setEnviando(true);
    const fd = new FormData();
    fd.append("emailProdutor", produtor?.email || "");
    fd.append("nomeProduto", formSugestao.nome);
    fd.append("descricao", formSugestao.descricao);
    if (formSugestao.precoSugerido) fd.append("precoSugerido", formSugestao.precoSugerido);
    if (fotoSugestao) fd.append("file", fotoSugestao);
    try {
      const res = await fetch("/api/produtor/sugestao", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Sugestão enviada!", { description: "Nossa equipe irá avaliar e adicionar ao catálogo." });
        setModalSugestaoOpen(false);
        setFormSugestao({ nome: "", descricao: "", precoSugerido: "" });
        setFotoSugestao(null);
      }
    } catch { toast.error("Erro ao enviar sugestão."); }
    finally { setEnviando(false); }
  };

  const enviarOferta = async (demanda: Demanda) => {
    const qty = inputsOferta[demanda.id] ?? 0;
    if (!qty || qty <= 0 || !produtor) return toast.warning("Insira uma quantidade válida.");
    setEnviando(true);
    try {
      const res = await fetch("/api/produtor/ofertas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandaId: demanda.id, quantidade: qty, emailProdutor: produtor.email }),
      });
      if (res.ok) {
        toast.success("Negócio registrado!", { description: "O mercado será notificado." });
        setInputsOferta({ ...inputsOferta, [demanda.id]: 0 });
        const res2 = await fetch("/api/mercado/demandas");
        if (res2.ok) setDemandasAbertas(await res2.json());
      } else {
        const d = await res.json();
        toast.error(d.error || "Erro ao registrar oferta.");
      }
    } catch { toast.error("Erro de conexão."); }
    finally { setEnviando(false); }
  };

  if (loading) return <PageLoader message="Carregando painel do produtor..." />;
  if (!produtor) return null;
  if (produtor.status !== "APROVADO")
    return <StatusBanner status={produtor.status} onLogout={() => { localStorage.clear(); router.push("/login"); }} />;

  const nomesMeusProdutos = catalogoOficial.filter((p) => meusProdutosIds.includes(p.cdProduto)).map((p) => p.nome.toLowerCase());
  const demandasNoMural = demandasAbertas.filter((d) =>
    d.status === "ABERTA" &&
    !d.ofertas.some((o) => o.emailProdutor === produtor.email) &&
    nomesMeusProdutos.includes(d.produto.toLowerCase())
  );
  const minhasDemandas = demandasAbertas.filter((d) => d.ofertas.some((o) => o.emailProdutor === produtor.email));
  const listaAtual = abaAtual === "mural" ? demandasNoMural : minhasDemandas;
  const listaFiltrada = listaAtual.filter((d) => d.produto.toLowerCase().includes(filtroBusca.toLowerCase()));

  const TABS = [
    { id: "mural",         label: `Mural de Oportunidades (${demandasNoMural.length})`, icon: <LayoutDashboard size={17} /> },
    { id: "meus_produtos", label: `Meu Catálogo (${meusProdutosIds.length})`,           icon: <Sprout size={17} /> },
    { id: "minhas_ofertas",label: `Ofertas Fechadas (${minhasDemandas.length})`,        icon: <ListChecks size={17} /> },
  ];

  return (
    <div className="rc-page">
      <div className="rc-container">

        <TabNav tabs={TABS} activeTab={abaAtual} onTabChange={setAbaAtual} />

        {/* ABA: MEU CATÁLOGO */}
        {abaAtual === "meus_produtos" && (
          <div className="space-y-6">
            <div className="rc-banner rc-banner-amber rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-black flex items-center gap-2"><Sprout size={20} /> Selecione o que você produz</h3>
                <p className="text-sm mt-1 opacity-80">Marque os produtos que você tem capacidade de vender. <b>O Mural só mostrará demandas dos produtos que você marcar aqui.</b></p>
              </div>
              <div className="flex gap-3 w-full md:w-auto shrink-0">
                <Button onClick={() => setModalSugestaoOpen(true)} variant="outline" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 flex-1 md:flex-none whitespace-nowrap">
                  <MessageSquarePlus size={17} /> Sugerir Novo
                </Button>
                <Button onClick={salvarMeuCatalogo} isLoading={salvandoCatalogo} className="bg-amber-600 hover:bg-amber-700 flex-1 md:flex-none whitespace-nowrap">
                  {!salvandoCatalogo && <Save size={17} />} Salvar Escolhas
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              <SearchBar value={filtroBusca} onChange={setFiltroBusca} placeholder="Buscar produto no catálogo..." accent="amber" className="w-full md:w-80" />
              <p className="text-sm text-amber-700 font-medium">
                {meusProdutosIds.length} selecionado{meusProdutosIds.length !== 1 ? "s" : ""}
                {filtroBusca && ` · ${catalogoOficial.filter((p) => p.nome.toLowerCase().includes(filtroBusca.toLowerCase())).length} resultado(s)`}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {catalogoOficial
                .filter((p) => !filtroBusca || p.nome.toLowerCase().includes(filtroBusca.toLowerCase()))
                .map((prod) => {
                  const sel = meusProdutosIds.includes(prod.cdProduto);
                  return (
                    <div key={prod.cdProduto} onClick={() => toggleProduto(prod.cdProduto)} className={`rc-produto-card ${sel ? "rc-produto-card-on" : "rc-produto-card-off"}`}>
                      <div className="relative w-16 h-16 mb-3">
                        {prod.imagemUrl ? (
                          <Image src={prod.imagemUrl} alt={prod.nome} fill className="object-cover rounded-full shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold">Sem foto</div>
                        )}
                        {sel && <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white"><CheckCircle size={13} /></div>}
                      </div>
                      <h3 className={`font-bold text-sm leading-tight ${sel ? "text-amber-900" : "text-gray-700"}`}>{prod.nome}</h3>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ABAS: MURAL E OFERTAS */}
        {(abaAtual === "mural" || abaAtual === "minhas_ofertas") && (
          <>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <Filter size={17} /> <span className="font-bold text-sm">Filtrar:</span>
              </div>
              <SearchBar value={filtroBusca} onChange={setFiltroBusca} placeholder="Buscar por produto..." className="w-full md:w-96" />
            </div>

            {abaAtual === "mural" && meusProdutosIds.length === 0 ? (
              <EmptyState
                icon={<Sprout size={56} className="text-amber-300" />}
                title="Seu Mural está escondido!"
                description="Para ver pedidos dos mercados, configure quais produtos você planta."
                actionLabel="Configurar Meu Catálogo"
                onAction={() => setAbaAtual("meus_produtos")}
              />
            ) : listaFiltrada.length === 0 ? (
              <EmptyState
                icon={<CheckCircle size={56} className="text-gray-300" />}
                title={abaAtual === "mural" ? "Nenhuma demanda no momento." : "Nenhuma oferta registrada."}
                description="Volte mais tarde ou diversifique seu catálogo."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listaFiltrada.map((demanda) => {
                  const atendido = demanda.ofertas.reduce((acc, o) => acc + o.quantidade, 0);
                  const faltante = demanda.quantidade - atendido;
                  const pct = (atendido / demanda.quantidade) * 100;
                  const minhaOferta = demanda.ofertas.find((o) => o.emailProdutor === produtor.email);
                  const qtdInput = inputsOferta[demanda.id] ?? 0;

                  return (
                    <Card key={demanda.id} flat className={`rc-demand-card ${minhaOferta ? "rc-demand-card-mine" : "rc-demand-card-default"}`}>
                      <div className="mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Mercado Precisa de</span>
                            <h3 className="text-2xl font-black text-gray-900">{demanda.produto}</h3>
                          </div>
                          <Badge variant={demanda.status === "CONCLUIDA" ? "success" : "warning"}>
                            {demanda.status === "CONCLUIDA" ? "Fechada" : "Aberta"}
                          </Badge>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between mb-4">
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Estimativa</p>
                            <p className="text-lg font-black text-green-700">R$ {Number(demanda.precoMedio || 0).toFixed(2)} <span className="text-xs text-gray-400 font-normal">/ {demanda.unidade}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Pedido</p>
                            <p className="text-lg font-black text-gray-800">{demanda.quantidade} <span className="text-xs text-gray-400 font-normal">{demanda.unidade}</span></p>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-gray-500">Preenchido: <span className="text-green-700">{atendido} {demanda.unidade}</span></span>
                          {!minhaOferta && <span className="text-amber-600">Faltam: {faltante} {demanda.unidade}</span>}
                        </div>
                        <ProgressBar value={pct} size="md" />
                      </div>

                      <div className="pt-5 border-t border-gray-100">
                        {minhaOferta ? (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                            <CheckCircle className="text-blue-700 mx-auto mb-1" size={22} />
                            <span className="font-black text-blue-900 text-sm">Você garantiu {minhaOferta.quantidade} {demanda.unidade}!</span>
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">Quanto você enviará?</label>
                            <div className="flex items-center gap-2">
                              <QuantityInput value={qtdInput} onChange={(v) => setInputsOferta({ ...inputsOferta, [demanda.id]: v })} min={0} max={faltante} className="w-1/2" />
                              <Button
                                onClick={() => enviarOferta(demanda)}
                                isLoading={enviando}
                                disabled={!qtdInput || qtdInput <= 0 || qtdInput > faltante}
                                className="w-1/2 h-12 font-bold"
                              >
                                Ofertar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={modalSugestaoOpen} onClose={() => setModalSugestaoOpen(false)} title="Sugerir Novo Produto">
        <p className="text-sm text-gray-500 mb-5">Não achou o que planta? Envie os detalhes e nossa equipe avalia.</p>
        <form onSubmit={enviarSugestao} className="space-y-4">
          <Input label="Nome do Produto *" name="nome" value={formSugestao.nome} onChange={(e) => setFormSugestao({ ...formSugestao, nome: e.target.value })} placeholder="Ex: Pitaya Vermelha" required />
          <Input label="Preço Sugerido por Kg (R$)" name="precoSugerido" type="number" step="0.01" value={formSugestao.precoSugerido} onChange={(e) => setFormSugestao({ ...formSugestao, precoSugerido: e.target.value })} placeholder="Ex: 8.50" />
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Descrição Breve</label>
            <textarea rows={3} value={formSugestao.descricao} onChange={(e) => setFormSugestao({ ...formSugestao, descricao: e.target.value })} placeholder="Ex: Cultivamos pitaya orgânica livre de agrotóxicos..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Foto de Referência (Opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFotoSugestao(e.target.files?.[0] || null)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 cursor-pointer" />
          </div>
          <Button type="submit" isLoading={enviando} className="w-full bg-amber-600 hover:bg-amber-700 h-12 mt-1">Enviar Sugestão</Button>
        </form>
      </Modal>
    </div>
  );
}
