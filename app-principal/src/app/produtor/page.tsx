/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner"; // Nossas notificações profissionais
import {
  Clock, CheckCircle, Search, Loader2, Plus, Minus,
  ListChecks, LayoutDashboard, Filter, Sprout, Save, UploadCloud, MessageSquarePlus, XCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge"; // Nosso componente de status
import { Modal } from "@/components/ui/Modal"; // Nosso componente de janelas

interface Oferta { quantidade: number; emailProdutor: string; }
interface Demanda { id: string; produto: string; quantidade: number; unidade: string; precoMedio: number; status: string; ofertas: Oferta[]; emailMercado: string; criadoEm: string; }
interface PerfilProdutor { email: string; nomeFantasia: string; status: string; }
interface ProdutoCatalogo { cdProduto: number; nome: string; tipo: string; imagemUrl: string; unidadePadrao: string; }

export default function PainelProdutor() {
  const router = useRouter();
  const [produtor, setProdutor] = useState<PerfilProdutor | null>(null);
  const [loading, setLoading] = useState(true);

  // Listas de Dados
  const [demandasAbertas, setDemandasAbertas] = useState<Demanda[]>([]);
  const [catalogoOficial, setCatalogoOficial] = useState<ProdutoCatalogo[]>([]);
  const [meusProdutosIds, setMeusProdutosIds] = useState<number[]>([]);

  const [inputsOferta, setInputsOferta] = useState<{ [key: string]: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [salvandoCatalogo, setSalvandoCatalogo] = useState(false);

  // Estados de UI
  const [abaAtual, setAbaAtual] = useState<"mural" | "meus_produtos" | "minhas_ofertas">("mural");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [modalSugestaoOpen, setModalSugestaoOpen] = useState(false);

  // Estado do Modal de Sugestão (SCRUM-137 - Atualizado com precoSugerido)
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
              fetch(`/api/mercado/demandas`),
              fetch(`/api/produtos`),
              fetch(`/api/produtor/meus-produtos?email=${emailLogado}`)
            ]);

            if (resDemandas.ok) setDemandasAbertas(await resDemandas.json());
            if (resCatalogo.ok) setCatalogoOficial(await resCatalogo.json());
            if (resMeusIds.ok) setMeusProdutosIds(await resMeusIds.json());
          }
        } else {
          router.push("/completar-perfil");
        }
      } catch (err) { toast.error("Erro ao carregar os dados."); }
      finally { setLoading(false); }
    }
    carregarDados();
  }, [router]);

  const toggleProduto = (id: number) => {
    setMeusProdutosIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const salvarMeuCatalogo = async () => {
    setSalvandoCatalogo(true);
    try {
      const res = await fetch("/api/produtor/meus-produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: produtor?.email, produtosIds: meusProdutosIds })
      });
      if (res.ok) {
        toast.success("Sua lista de produtos foi salva!", { description: "O Mural de Demandas foi atualizado com base no seu catálogo." });
      } else {
        toast.error("Erro ao salvar catálogo.");
      }
    } catch (err) { toast.error("Erro de conexão ao salvar catálogo."); }
    finally { setSalvandoCatalogo(false); }
  };

  // Enviar Sugestão Atualizada (SCRUM-137)
  const enviarSugestao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSugestao.nome) return toast.warning("Dê um nome ao produto.");

    setEnviando(true);
    const formData = new FormData();
    formData.append("emailProdutor", produtor?.email || "");
    formData.append("nomeProduto", formSugestao.nome);
    formData.append("descricao", formSugestao.descricao);

    // Injeta o preço sugerido se ele tiver sido preenchido
    if (formSugestao.precoSugerido) {
      formData.append("precoSugerido", formSugestao.precoSugerido);
    }

    if (fotoSugestao) formData.append("file", fotoSugestao);

    try {
      const res = await fetch("/api/produtor/sugestao", { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Sugestão enviada!", { description: "Nossa equipe irá avaliar e adicionar ao catálogo oficial." });
        setModalSugestaoOpen(false);
        setFormSugestao({ nome: "", descricao: "", precoSugerido: "" }); // Reseta todos os campos
        setFotoSugestao(null);
      }
    } catch (err) { toast.error("Erro ao enviar sugestão."); }
    finally { setEnviando(false); }
  };

  const alterarQuantidade = (id: string, delta: number, maximo: number) => {
    const atual = Number(inputsOferta[id]) || 0;
    let nova = atual + delta;
    if (nova < 0) nova = 0;
    if (nova > maximo) nova = maximo;
    setInputsOferta({ ...inputsOferta, [id]: nova.toString() });
  };

  const enviarOferta = async (demanda: Demanda) => {
    const quantity = inputsOferta[demanda.id];
    if (!quantity || Number(quantity) <= 0 || !produtor) return toast.warning("Insira uma quantidade válida para ofertar.");

    setEnviando(true);
    try {
      const res = await fetch("/api/produtor/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandaId: demanda.id, quantidade: quantity, emailProdutor: produtor.email })
      });
      if (res.ok) {
        toast.success("Negócio registrado!", { description: "O mercado será notificado da sua oferta." });
        setInputsOferta({ ...inputsOferta, [demanda.id]: "" });

        const resDemandas = await fetch(`/api/mercado/demandas`);
        if (resDemandas.ok) setDemandasAbertas(await resDemandas.json());
      } else {
        const dados = await res.json();
        toast.error(dados.error || "Erro ao registrar oferta.");
      }
    } catch (err) { toast.error("Erro de conexão ao ofertar."); }
    finally { setEnviando(false); }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center font-bold text-green-700"><Loader2 className="animate-spin mb-4" size={40} /> Carregando painel do produtor...</div>;
  if (!produtor) return null;

  if (produtor.status !== "APROVADO") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className={`p-12 text-center shadow-lg max-w-lg border-t-4 ${produtor.status === "REJEITADO" ? "border-red-500" : "border-amber-500"}`}>
          {produtor.status === "REJEITADO" ? (
            <>
              <XCircle size={64} className="mx-auto text-red-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro Recusado</h2>
              <p className="text-gray-600 mb-6">Entre em contato com a administração para revisar seus documentos.</p>
            </>
          ) : (
            <>
              <Clock size={64} className="mx-auto text-amber-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta em Análise</h2>
              <p className="text-gray-600 mb-6">Sua documentação está com os administradores. Aguarde a liberação.</p>
            </>
          )}
          <Button onClick={() => { localStorage.clear(); router.push("/login"); }} variant="outline" className="w-full">Sair</Button>
        </Card>
      </div>
    );
  }

  const nomesMeusProdutos = catalogoOficial.filter(p => meusProdutosIds.includes(p.cdProduto)).map(p => p.nome.toLowerCase());
  const demandasNoMural = demandasAbertas.filter(d =>
    d.status === "ABERTA" &&
    !d.ofertas.some(o => o.emailProdutor === produtor.email) &&
    nomesMeusProdutos.includes(d.produto.toLowerCase())
  );

  const minhasDemandas = demandasAbertas.filter(d => d.ofertas.some((o) => o.emailProdutor === produtor.email));
  const listaAtual = abaAtual === "mural" ? demandasNoMural : minhasDemandas;
  const listaFiltrada = listaAtual.filter((d) => d.produto.toLowerCase().includes(filtroBusca.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 relative">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
          <button onClick={() => setAbaAtual("mural")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "mural" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            <LayoutDashboard size={18} /> Mural de Oportunidades ({demandasNoMural.length})
          </button>
          <button onClick={() => setAbaAtual("meus_produtos")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "meus_produtos" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            <Sprout size={18} /> Meu Catálogo ({meusProdutosIds.length})
          </button>
          <button onClick={() => setAbaAtual("minhas_ofertas")} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "minhas_ofertas" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            <ListChecks size={18} /> Ofertas Fechadas ({minhasDemandas.length})
          </button>
        </div>

        {/* ABA: MEU CATÁLOGO */}
        {abaAtual === "meus_produtos" && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-800 flex justify-between items-center flex-col md:flex-row gap-4">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2"><Sprout /> Selecione o que você produz</h3>
                <p className="text-sm mt-1">Marque abaixo os produtos que você tem capacidade de vender. <b>O Mural de Oportunidades só mostrará demandas para os produtos que você marcar aqui.</b></p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button onClick={() => setModalSugestaoOpen(true)} variant="outline" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 flex-1 md:flex-none">
                  <MessageSquarePlus size={18} className="mr-2" /> Sugerir Novo
                </Button>
                <Button onClick={salvarMeuCatalogo} isLoading={salvandoCatalogo} className="bg-amber-600 hover:bg-amber-700 flex-1 md:flex-none">
                  {!salvandoCatalogo && <Save size={18} className="mr-2" />} Salvar Escolhas
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {catalogoOficial.map((prod) => {
                const isSelecionado = meusProdutosIds.includes(prod.cdProduto);
                return (
                  <div key={prod.cdProduto} onClick={() => toggleProduto(prod.cdProduto)} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${isSelecionado ? "border-amber-500 bg-amber-50/50 shadow-md" : "border-gray-200 bg-white hover:border-amber-300"}`}>
                    <div className="relative w-16 h-16 mb-3">
                      {prod.imagemUrl ? (
                        <Image src={prod.imagemUrl} alt={prod.nome} layout="fill" objectFit="cover" className="rounded-full shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold shadow-sm">Sem Foto</div>
                      )}
                      {isSelecionado && <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white"><CheckCircle size={14} /></div>}
                    </div>
                    <h3 className={`font-bold text-sm leading-tight ${isSelecionado ? "text-amber-900" : "text-gray-700"}`}>{prod.nome}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABAS: MURAL E OFERTAS FECHADAS */}
        {(abaAtual === "mural" || abaAtual === "minhas_ofertas") && (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-gray-700 w-full md:w-auto">
                <Filter size={20} className="text-gray-400" />
                <span className="font-bold">Filtros:</span>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar produto..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>

            {abaAtual === "mural" && meusProdutosIds.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm">
                <Sprout size={56} className="mx-auto mb-4 text-amber-300" />
                <h3 className="text-xl font-black text-gray-700 mb-2">Seu Mural está escondido!</h3>
                <p className="text-base text-gray-500 mb-6">Para ver os pedidos dos mercados, você precisa nos contar o que você planta.</p>
                <Button onClick={() => setAbaAtual("meus_produtos")} className="bg-amber-500 hover:bg-amber-600">Configurar Meu Catálogo Agora</Button>
              </div>
            ) : listaFiltrada.length === 0 ? (
              <div className="text-center py-24 text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm">
                <CheckCircle size={56} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-black text-gray-700 mb-2">{abaAtual === "mural" ? "Nenhuma demanda no momento." : "Nenhuma oferta registrada."}</h3>
                <p className="text-base text-gray-500">Volte mais tarde ou divulgue novos produtos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listaFiltrada.map((demanda) => {
                  const qtdJaAtendida = demanda.ofertas.reduce((acc, ofr) => acc + ofr.quantidade, 0);
                  const qtdFaltante = demanda.quantidade - qtdJaAtendida;
                  const porcentagem = (qtdJaAtendida / demanda.quantidade) * 100;
                  const minhaOferta = demanda.ofertas.find((o) => o.emailProdutor === produtor.email);

                  return (
                    <Card key={demanda.id} className={`p-6 flex flex-col justify-between transition-all duration-300 ${minhaOferta ? "border-blue-200 shadow-md bg-blue-50/20" : "border-gray-200 hover:border-green-400 hover:shadow-lg bg-white"}`}>
                      <div className="mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Mercado Precisa de</span>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight">{demanda.produto}</h3>
                          </div>
                          <div className="text-right">
                            <Badge variant={demanda.status === "CONCLUIDA" ? "success" : "warning"}>
                              {demanda.status === "CONCLUIDA" ? "Carga Fechada" : "Aberta"}
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center mb-4">
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Estimativa Paga</p>
                            <p className="text-lg font-black text-green-700">R$ {Number(demanda.precoMedio || 0).toFixed(2)} <span className="text-xs text-gray-500 font-normal">/ {demanda.unidade}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Pedido Total</p>
                            <p className="text-lg font-black text-gray-800">{demanda.quantidade} <span className="text-xs text-gray-500 font-normal">{demanda.unidade}</span></p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-gray-600">Preenchido: <span className="text-green-700">{qtdJaAtendida}{demanda.unidade}</span></span>
                            {!minhaOferta && <span className="text-amber-600">Faltam: {qtdFaltante}{demanda.unidade}</span>}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${porcentagem}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-gray-100">
                        {minhaOferta ? (
                          <div className="bg-blue-100 p-4 rounded-xl border border-blue-200 text-center flex flex-col items-center justify-center gap-1">
                            <CheckCircle className="text-blue-700 mb-1" size={24} />
                            <span className="font-black text-blue-900 text-sm">Você garantiu {minhaOferta.quantidade} {demanda.unidade}!</span>
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">Quanto você enviará?</label>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-sm w-1/2 h-12">
                                <button type="button" onClick={() => alterarQuantidade(demanda.id, -1, qtdFaltante)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"><Minus size={16} /></button>
                                <input type="number" min="0" max={qtdFaltante} value={inputsOferta[demanda.id] || "0"} onChange={(e) => setInputsOferta({ ...inputsOferta, [demanda.id]: e.target.value })} className="w-full text-center font-black text-lg bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <button type="button" onClick={() => alterarQuantidade(demanda.id, 1, qtdFaltante)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"><Plus size={16} /></button>
                              </div>
                              <Button
                                onClick={() => enviarOferta(demanda)}
                                isLoading={enviando}
                                disabled={!inputsOferta[demanda.id] || Number(inputsOferta[demanda.id]) <= 0 || Number(inputsOferta[demanda.id]) > qtdFaltante}
                                className="w-1/2 h-12 shadow-md font-bold"
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

      {/* MODAL DE SUGESTÃO DE PRODUTO (SCRUM-137 - Atualizado com Campo de Preço) */}
      <Modal
        isOpen={modalSugestaoOpen}
        onClose={() => setModalSugestaoOpen(false)}
        title="Sugerir Novo Produto"
      >
        <p className="text-sm text-gray-500 mb-6">
          Não achou o que planta na lista? Envie os detalhes, o preço sugerido por Kg e uma foto para nossa equipe avaliar e adicionar ao catálogo oficial.
        </p>

        <form onSubmit={enviarSugestao} className="space-y-4">
          <Input
            label="Nome do Produto *"
            name="nome"
            value={formSugestao.nome}
            onChange={e => setFormSugestao({ ...formSugestao, nome: e.target.value })}
            placeholder="Nome do Produto"
            required
          />

          {/* NOVO CAMPO: PREÇO SUGERIDO (MATCH COM A API DO PROD/ADMIN) */}
          <Input
            label="Preço Sugerido por Kg (R$)"
            name="precoSugerido"
            type="number"
            step="0.01"
            value={formSugestao.precoSugerido}
            onChange={e => setFormSugestao({ ...formSugestao, precoSugerido: e.target.value })}
            placeholder="Ex: 0.00"
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Descrição Breve</label>
            <textarea
              rows={3}
              value={formSugestao.descricao}
              onChange={e => setFormSugestao({ ...formSugestao, descricao: e.target.value })}
              placeholder="Adicione uma descrição sobre sua Sugestão"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            ></textarea>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Foto de Referência (Opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFotoSugestao(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded-lg bg-gray-50 text-sm outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
            />
          </div>

          <Button type="submit" isLoading={enviando} className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg mt-2">
            Enviar Sugestão
          </Button>
        </form>
      </Modal>

    </div>
  );
}