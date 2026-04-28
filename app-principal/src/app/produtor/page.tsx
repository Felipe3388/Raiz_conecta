/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  ShieldCheck,
  XCircle,
  Handshake,
  MapPin,
  Search,
  Info,
  Loader2,
  Plus,
  Minus,
  ListChecks,
  LayoutDashboard,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Oferta {
  quantidade: number;
  emailProdutor: string;
}

interface Demanda {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  status: string;
  ofertas: Oferta[];
  emailMercado: string;
  criadoEm: string;
}

interface PerfilProdutor {
  email: string;
  nomeFantasia: string;
  status: string;
}

export default function PainelProdutor() {
  const router = useRouter();
  const [produtor, setProdutor] = useState<PerfilProdutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [demandasAbertas, setDemandasAbertas] = useState<Demanda[]>([]);
  const [inputsOferta, setInputsOferta] = useState<{ [key: string]: string }>(
    {},
  );
  const [enviando, setEnviando] = useState(false);

  // Novos Estados (Filtros e Abas)
  const [abaAtual, setAbaAtual] = useState<"mural" | "minhas_ofertas">("mural");
  const [filtroBusca, setFiltroBusca] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const emailLogado = localStorage.getItem("userEmail");
      if (!emailLogado) return router.push("/login");

      try {
        const resPerfil = await fetch(
          `/api/vendedor/perfil?email=${emailLogado}`,
        );
        if (resPerfil.ok) {
          const dadosPerfil = await resPerfil.json();

          if (!dadosPerfil) {
            router.push("/completar-perfil");
            return;
          }

          setProdutor(dadosPerfil);

          if (dadosPerfil.status === "APROVADO") {
            buscarOportunidades();
          }
        } else {
          router.push("/completar-perfil");
        }
      } catch (err) {
        console.error("Erro ao buscar perfil", err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [router]);

  const buscarOportunidades = async () => {
    try {
      const res = await fetch(`/api/mercado/demandas`);
      const todasDemandas = await res.json();
      setDemandasAbertas(todasDemandas);
    } catch (err) {
      console.error("Erro ao buscar demandas", err);
    }
  };

  // Nova função para os botões de + e -
  const alterarQuantidade = (id: string, delta: number, maximo: number) => {
    const atual = Number(inputsOferta[id]) || 0;
    let nova = atual + delta;
    if (nova < 0) nova = 0;
    if (nova > maximo) nova = maximo;
    setInputsOferta({ ...inputsOferta, [id]: nova.toString() });
  };

  const enviarOferta = async (demanda: Demanda) => {
    const quantidade = inputsOferta[demanda.id];
    if (!quantidade || Number(quantidade) <= 0 || !produtor) {
      return alert("Insira uma quantidade válida para ofertar.");
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/produtor/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandaId: demanda.id,
          quantidade: quantidade,
          emailProdutor: produtor.email,
        }),
      });

      if (res.ok) {
        alert(
          "🎉 Negócio registrado! O mercado será notificado da sua oferta.",
        );
        setInputsOferta({ ...inputsOferta, [demanda.id]: "" });
        buscarOportunidades();
      } else {
        const dados = await res.json();
        alert(dados.error || "Erro ao registrar oferta.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-green-700">
        Carregando painel do produtor...
      </div>
    );
  if (!produtor) return null;

  if (produtor.status !== "APROVADO") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card
          className={`p-12 text-center shadow-lg max-w-lg border-t-4 ${produtor.status === "REJEITADO" ? "border-red-500" : "border-amber-500"}`}
        >
          {produtor.status === "REJEITADO" ? (
            <>
              <XCircle size={64} className="mx-auto text-red-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Cadastro Recusado
              </h2>
              <p className="text-gray-600 mb-6">
                Entre em contato com a administração para revisar seus
                documentos.
              </p>
            </>
          ) : (
            <>
              <Clock
                size={64}
                className="mx-auto text-amber-500 mb-6 animate-pulse"
              />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Conta em Análise
              </h2>
              <p className="text-gray-600 mb-6">
                Sua documentação está com os administradores. Aguarde a
                liberação.
              </p>
            </>
          )}
          <Button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            variant="outline"
            className="w-full"
          >
            Sair
          </Button>
        </Card>
      </div>
    );
  }

  // Divisão das listas: O Mural (O que falta fechar) e As Minhas Ofertas (O que eu já garanti)
  const demandasNoMural = demandasAbertas.filter(
    (d) =>
      d.status === "ABERTA" &&
      !d.ofertas.some((o) => o.emailProdutor === produtor.email),
  );
  const minhasDemandas = demandasAbertas.filter((d) =>
    d.ofertas.some((o) => o.emailProdutor === produtor.email),
  );

  const listaAtual = abaAtual === "mural" ? demandasNoMural : minhasDemandas;
  const listaFiltrada = listaAtual.filter((d) =>
    d.produto.toLowerCase().includes(filtroBusca.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">

      <div className="max-w-350 mx-auto p-4 md:p-8 space-y-6">
        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setAbaAtual("mural")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "mural" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <LayoutDashboard size={18} /> Mural da Região (
            {demandasNoMural.length})
          </button>
          <button
            onClick={() => setAbaAtual("minhas_ofertas")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "minhas_ofertas" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <ListChecks size={18} /> Minhas Ofertas Fechadas (
            {minhasDemandas.length})
          </button>
        </div>

        {/* BARRA DE FILTROS IDÊNTICA A DO MERCADO */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-gray-700 w-full md:w-auto">
            <Filter size={20} className="text-gray-400" />
            <span className="font-bold">Filtros:</span>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        {/* LISTAGEM DOS CARDS */}
        {listaFiltrada.length === 0 ? (
          <div className="text-center py-24 text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm">
            <CheckCircle size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-black text-gray-700 mb-2">
              {abaAtual === "mural"
                ? "Mural Limpo!"
                : "Nenhuma oferta registrada."}
            </h3>
            <p className="text-base text-gray-500">
              {abaAtual === "mural"
                ? "Nenhum mercado está solicitando produtos na sua região no momento."
                : "Você ainda não fechou negócio em nenhuma cotação."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {listaFiltrada.map((demanda) => {
              const qtdJaAtendida = demanda.ofertas.reduce(
                (acc, ofr) => acc + ofr.quantidade,
                0,
              );
              const qtdFaltante = demanda.quantidade - qtdJaAtendida;
              const porcentagem = (qtdJaAtendida / demanda.quantidade) * 100;
              const minhaOferta = demanda.ofertas.find(
                (o) => o.emailProdutor === produtor.email,
              );

              return (
                <Card
                  key={demanda.id}
                  className={`p-6 flex flex-col justify-between transition-all duration-300 ${minhaOferta ? "border-blue-200 shadow-md bg-blue-50/20" : "border-gray-200 hover:border-green-400 hover:shadow-lg bg-white"}`}
                >
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                          Mercado Precisa de
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">
                          {demanda.produto}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded uppercase ${demanda.status === "CONCLUIDA" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {demanda.status === "CONCLUIDA"
                            ? "Carga Fechada"
                            : "Aberta"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                          Estimativa Paga
                        </p>
                        <p className="text-lg font-black text-green-700">
                          R$ {Number(demanda.precoMedio || 0).toFixed(2)}{" "}
                          <span className="text-xs text-gray-500 font-normal">
                            / {demanda.unidade}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                          Pedido Total
                        </p>
                        <p className="text-lg font-black text-gray-800">
                          {demanda.quantidade}{" "}
                          <span className="text-xs text-gray-500 font-normal">
                            {demanda.unidade}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-gray-600">
                          Preenchido:{" "}
                          <span className="text-green-700">
                            {qtdJaAtendida}
                            {demanda.unidade}
                          </span>
                        </span>
                        {!minhaOferta && (
                          <span className="text-amber-600">
                            Faltam: {qtdFaltante}
                            {demanda.unidade}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${porcentagem}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100">
                    {minhaOferta ? (
                      <div className="bg-blue-100 p-4 rounded-xl border border-blue-200 text-center flex flex-col items-center justify-center gap-1">
                        <CheckCircle className="text-blue-700 mb-1" size={24} />
                        <span className="font-black text-blue-900 text-sm">
                          Você garantiu {minhaOferta.quantidade}{" "}
                          {demanda.unidade}!
                        </span>
                        <span className="text-xs text-blue-700 font-medium mt-1">
                          Sua parte do pedido está garantida.
                        </span>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">
                          Quanto você enviará?
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-sm w-1/2 h-12">
                            <button
                              onClick={() =>
                                alterarQuantidade(demanda.id, -1, qtdFaltante)
                              }
                              className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Minus size={16} />
                            </button>

                            <input
                              type="number"
                              min="0"
                              max={qtdFaltante}
                              value={inputsOferta[demanda.id] || "0"}
                              onChange={(e) =>
                                setInputsOferta({
                                  ...inputsOferta,
                                  [demanda.id]: e.target.value,
                                })
                              }
                              className="w-full text-center font-black text-lg bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            <button
                              onClick={() =>
                                alterarQuantidade(demanda.id, 1, qtdFaltante)
                              }
                              className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <Button
                            onClick={() => enviarOferta(demanda)}
                            disabled={
                              enviando ||
                              !inputsOferta[demanda.id] ||
                              Number(inputsOferta[demanda.id]) <= 0 ||
                              Number(inputsOferta[demanda.id]) > qtdFaltante
                            }
                            className="w-1/2 h-12 bg-green-600 hover:bg-green-700 shadow-md font-bold"
                          >
                            {enviando ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              "Ofertar"
                            )}
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
      </div>
    </div>
  );
}
