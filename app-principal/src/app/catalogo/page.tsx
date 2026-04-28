/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  PackageOpen,
  ArrowRight,
  Trash2,
  Filter,
  LayoutDashboard,
  ListChecks,
  CheckCircle,
  Star,
  ShoppingBasket,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CatalogoMercado() {
  const router = useRouter();
  const [mercado, setMercado] = useState<any>(null);
  const [produtosDb, setProdutosDb] = useState<any[]>([]);
  const [minhasDemandas, setMinhasDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrinho, setCarrinho] = useState<any[]>([]);

  // Abas e Filtros
  const [abaAtual, setAbaAtual] = useState<"vitrine" | "cotacoes">("vitrine");
  const [inputQtd, setInputQtd] = useState<{ [key: number]: string }>({});
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Estados da Avaliação do Produtor após entrega
  const [avaliandoOfertaId, setAvaliandoOfertaId] = useState<string | null>(
    null,
  );
  const [notaAtual, setNotaAtual] = useState<number>(5);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      const email = localStorage.getItem("userEmail");
      if (!email) return router.push("/login");

      try {
        const resMercado = await fetch(`/api/mercado/perfil?email=${email}`);
        if (resMercado.ok) setMercado(await resMercado.json());

        const resProdutos = await fetch("/api/produtos");
        if (resProdutos.ok) {
          const produtos = await resProdutos.json();
          setProdutosDb(produtos);
          const qtdsIniciais: any = {};
          produtos.forEach((p: any) => (qtdsIniciais[p.cdProduto] = "1"));
          setInputQtd(qtdsIniciais);
        }

        const carrinhoSalvo = localStorage.getItem("carrinhoRaiz");
        if (carrinhoSalvo) setCarrinho(JSON.parse(carrinhoSalvo));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [router]);

  const carregarMinhasCotacoes = async () => {
    if (mercado) {
      try {
        const res = await fetch("/api/mercado/demandas");
        const todas = await res.json();
        setMinhasDemandas(
          todas.filter((d: any) => d.emailMercado === mercado.email),
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (abaAtual === "cotacoes") carregarMinhasCotacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtual, mercado]);

  const confirmarEntregaEAvaliar = async (ofertaId: string) => {
    setEnviandoAvaliacao(true);
    try {
      const res = await fetch("/api/mercado/avaliar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ofertaId, nota: notaAtual }),
      });
      if (res.ok) {
        alert("Entrega confirmada e Produtor avaliado com sucesso!");
        setAvaliandoOfertaId(null);
        carregarMinhasCotacoes();
      } else {
        alert("Erro ao salvar avaliação.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const atualizarCarrinho = (novoCarrinho: any[]) => {
    setCarrinho(novoCarrinho);
    if (novoCarrinho.length === 0) localStorage.removeItem("carrinhoRaiz");
    else localStorage.setItem("carrinhoRaiz", JSON.stringify(novoCarrinho));
  };

  const alterarQtdInputCard = (id: number, delta: number) => {
    const atual = Number(inputQtd[id]) || 1;
    let nova = atual + delta;
    if (nova < 1) nova = 1;
    setInputQtd({ ...inputQtd, [id]: nova.toString() });
  };

  const adicionarAoCarrinhoLote = (produto: any) => {
    const qtdDesejada = Number(inputQtd[produto.cdProduto]) || 1;
    if (qtdDesejada <= 0) return alert("Quantidade inválida.");

    const existe = carrinho.find((item) => item.id === produto.cdProduto);
    if (existe) {
      atualizarCarrinho(
        carrinho.map((item) =>
          item.id === produto.cdProduto
            ? { ...item, qtd: item.qtd + qtdDesejada }
            : item,
        ),
      );
    } else {
      atualizarCarrinho([
        ...carrinho,
        {
          id: produto.cdProduto,
          nome: produto.nome,
          precoEstimado: produto.preco || 0,
          qtd: qtdDesejada,
          icone: produto.icone,
        },
      ]);
    }
    setInputQtd({ ...inputQtd, [produto.cdProduto]: "1" });
  };

  const alterarQuantidadeCarrinho = (id: number, delta: number) => {
    const item = carrinho.find((c) => c.id === id);
    if (!item) return;
    const novaQtd = item.qtd + delta;
    if (novaQtd < 1) return removerItemCompleto(id);
    atualizarCarrinho(
      carrinho.map((c) => (c.id === id ? { ...c, qtd: novaQtd } : c)),
    );
  };

  const removerItemCompleto = (id: number) =>
    atualizarCarrinho(carrinho.filter((item) => item.id !== id));
  const limparCarrinho = () => {
    if (confirm("Esvaziar a cotação?")) atualizarCarrinho([]);
  };

  const categoriasUnicas = [
    "Todas",
    ...Array.from(new Set(produtosDb.map((p) => p.categoria).filter(Boolean))),
  ];
  const produtosFiltrados = produtosDb.filter((prod) => {
    return (
      prod.nome.toLowerCase().includes(filtroBusca.toLowerCase()) &&
      (filtroCategoria === "Todas" || prod.categoria === filtroCategoria)
    );
  });

  const totalEstimado = carrinho.reduce(
    (acc, item) => acc + item.precoEstimado * item.qtd,
    0,
  );

  if (loading)
    return (
      <div className="p-20 text-center font-bold text-green-700">
        Carregando catálogo...
      </div>
    );
  if (!mercado) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <PackageOpen size={64} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Ops! Dados do Mercado não encontrados.
        </h2>
        <p className="text-gray-600 mb-6">
          Isso acontece se você está logado com uma conta de{" "}
          <strong>Produtor Rural</strong>.
        </p>
        <Button
          onClick={() => {
            localStorage.clear();
            router.push("/login");
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Fazer Login Novamente
        </Button>
      </div>
    );
  }
  if (mercado.status !== "APROVADO")
    return (
      <div className="p-10 text-center font-bold text-amber-600">
        Cadastro em Análise...
      </div>
    );

  const isCarrinhoVazio = carrinho.length === 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">

      <div className="max-w-350 mx-auto p-4 md:p-8 space-y-6">
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setAbaAtual("vitrine")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "vitrine" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <LayoutDashboard size={18} /> Nova Cotação
          </button>
          <button
            onClick={() => setAbaAtual("cotacoes")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${abaAtual === "cotacoes" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <ListChecks size={18} /> Minhas Cotações Ativas
          </button>
        </div>

        {/* VITRINE */}
        {abaAtual === "vitrine" && (
          <div className="flex flex-col lg:flex-row gap-8 transition-all duration-500">
            <div
              className={`w-full transition-all duration-500 ${isCarrinhoVazio ? "lg:w-full" : "lg:w-2/3"} space-y-6`}
            >
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="py-2.5 px-3 rounded-lg border border-gray-300 outline-none bg-white font-semibold"
                  >
                    {categoriasUnicas.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                    <PackageOpen
                      size={48}
                      className="mx-auto mb-4 opacity-30"
                    />
                    <p className="text-lg font-medium text-gray-500">
                      Nenhum produto encontrado.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${isCarrinhoVazio ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3"} gap-6`}
                  >
                    {produtosFiltrados.map((prod, index) => {
                      const noCarrinho = carrinho.find(
                        (c) => c.id === prod.cdProduto,
                      );
                      return (
                        <div
                          key={prod.cdProduto || index}
                          className={`border-2 rounded-2xl p-5 text-center transition-all bg-white flex flex-col justify-between ${noCarrinho ? "border-green-500 shadow-md ring-4 ring-green-50" : "border-gray-100 hover:border-green-300"}`}
                        >
                          <div>
                            <div className="text-6xl mb-4 select-none">
                              {prod.icone || "📦"}
                            </div>
                            <h3 className="font-extrabold text-lg text-gray-800 mb-1">
                              {prod.nome}
                            </h3>
                            <p className="text-xs text-gray-400 mb-3 bg-gray-100 inline-block px-2 py-1 rounded-full">
                              {prod.categoria}
                            </p>
                            <div className="bg-gray-50 p-2 rounded-lg mb-4">
                              <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                                Estimativa (Ref)
                              </p>
                              <p className="text-xl text-green-700 font-black">
                                R$ {Number(prod.preco || 0).toFixed(2)}{" "}
                                <span className="text-xs text-gray-500 font-normal">
                                  / kg
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-1 h-11 w-full">
                              <button
                                onClick={() =>
                                  alterarQtdInputCard(prod.cdProduto, -1)
                                }
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={inputQtd[prod.cdProduto] || "1"}
                                onChange={(e) =>
                                  setInputQtd({
                                    ...inputQtd,
                                    [prod.cdProduto]: e.target.value,
                                  })
                                }
                                className="w-16 text-center font-black text-lg border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">
                                Kg
                              </span>
                              <button
                                onClick={() =>
                                  alterarQtdInputCard(prod.cdProduto, 1)
                                }
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <Button
                              onClick={() => adicionarAoCarrinhoLote(prod)}
                              className="w-full h-11 font-bold bg-green-600 hover:bg-green-700 shadow-sm"
                            >
                              <Plus size={18} className="mr-1" /> Adicionar
                              Cotação
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {!isCarrinhoVazio && (
              <div className="w-full lg:w-1/3 transition-all animate-in slide-in-from-right-8 fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-100 sticky top-24">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="text-green-600" /> Cotação
                    </h2>
                    <button
                      onClick={limparCarrinho}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      title="Esvaziar Cotação"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-8 max-h-112.5 overflow-y-auto pr-2">
                    {carrinho.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group"
                      >
                        <button
                          onClick={() => removerItemCompleto(item.id)}
                          className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 shadow-sm rounded-full p-1 border border-gray-200 hidden group-hover:block transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            {item.icone || "📦"}
                          </span>
                          <div>
                            <p className="font-bold text-base text-gray-900 leading-tight">
                              {item.nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              R$ {item.precoEstimado.toFixed(2)} / kg
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                          <span className="text-xs text-gray-500 font-bold ml-2 uppercase">
                            Vol. (Kg)
                          </span>
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                alterarQuantidadeCarrinho(item.id, -1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-black text-lg text-green-800">
                              {item.qtd}
                            </span>
                            <button
                              onClick={() =>
                                alterarQuantidadeCarrinho(item.id, 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-gray-200 pt-5 mb-6">
                    <div className="flex justify-between items-center text-xl font-black text-gray-900 mb-2">
                      <span>Estimativa Total</span>
                      <span className="text-green-700">
                        R$ {totalEstimado.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/checkout")}
                    className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                  >
                    Revisar e Disparar <ArrowRight size={22} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COTAÇÕES */}
        {abaAtual === "cotacoes" && (
          <div>
            {minhasDemandas.length === 0 ? (
              <div className="text-center py-24 text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm">
                <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-black text-gray-700 mb-2">
                  Nenhuma cotação ativa
                </h3>
                <p className="text-base text-gray-500">
                  Volte para a aba &quot;Nova Cotação&quot; para pedir produtos
                  aos produtores da região.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {minhasDemandas.map((demanda, idx) => {
                  const qtdRecebida = demanda.ofertas.reduce(
                    (acc: any, ofr: any) => acc + ofr.quantidade,
                    0,
                  );
                  const porcentagem = (qtdRecebida / demanda.quantidade) * 100;

                  return (
                    <Card
                      key={demanda.id || idx}
                      className="p-6 bg-white border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900">
                            {demanda.produto}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Disparado em:{" "}
                            {new Date(demanda.criadoEm).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-black px-3 py-1.5 rounded-lg uppercase ${demanda.status === "CONCLUIDA" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                          >
                            {demanda.status}
                          </span>
                          <p className="text-xl font-black text-gray-800 mt-2">
                            {demanda.quantidade}{" "}
                            <span className="text-sm text-gray-500 font-normal">
                              {demanda.unidade}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-gray-600">
                            Volume Garantido:{" "}
                            <span className="text-blue-600">
                              {qtdRecebida}
                              {demanda.unidade}
                            </span>
                          </span>
                          <span className="text-gray-400">
                            {porcentagem.toFixed(0)}% preenchido
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${demanda.status === "CONCLUIDA" ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600" />{" "}
                          Produtores que fecharam negócio
                        </h4>
                        {demanda.ofertas.length === 0 ? (
                          <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center border border-dashed border-gray-200">
                            Nenhum produtor ofertou ainda. Aguardando...
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {demanda.ofertas.map((oferta: any) => (
                              <div
                                key={oferta.id}
                                className={`flex flex-col p-3 rounded-lg border ${oferta.statusEntrega === "ENTREGUE" ? "bg-green-50/50 border-green-200" : "bg-blue-50/50 border-blue-100"}`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <p
                                      className={`text-sm font-bold ${oferta.statusEntrega === "ENTREGUE" ? "text-green-900" : "text-blue-900"}`}
                                    >
                                      {oferta.emailProdutor.split("@")[0]}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase">
                                      Garantido:{" "}
                                      <span className="font-bold">
                                        {oferta.quantidade} kg
                                      </span>
                                    </p>
                                  </div>
                                  {oferta.statusEntrega === "ENTREGUE" ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded uppercase mb-1">
                                        Entregue
                                      </span>
                                      <div className="flex gap-0.5 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            size={14}
                                            fill={
                                              i < oferta.nota
                                                ? "currentColor"
                                                : "none"
                                            }
                                            className={
                                              i < oferta.nota
                                                ? "text-amber-400"
                                                : "text-gray-300"
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() =>
                                        setAvaliandoOfertaId(
                                          avaliandoOfertaId === oferta.id
                                            ? null
                                            : oferta.id,
                                        )
                                      }
                                      variant="outline"
                                      className="h-8 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-100"
                                    >
                                      Avaliar Entrega
                                    </Button>
                                  )}
                                </div>

                                {avaliandoOfertaId === oferta.id &&
                                  oferta.statusEntrega !== "ENTREGUE" && (
                                    <div className="mt-2 pt-3 border-t border-blue-200 animate-in slide-in-from-top-2">
                                      <p className="text-xs font-bold text-gray-700 mb-2">
                                        Como foi o produto/entrega?
                                      </p>
                                      <div className="flex items-center gap-1 mb-3 cursor-pointer">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            size={24}
                                            onClick={() => setNotaAtual(star)}
                                            fill={
                                              star <= notaAtual
                                                ? "currentColor"
                                                : "none"
                                            }
                                            className={`${star <= notaAtual ? "text-amber-400" : "text-gray-300"} hover:scale-110 transition-transform`}
                                          />
                                        ))}
                                      </div>
                                      <Button
                                        onClick={() =>
                                          confirmarEntregaEAvaliar(oferta.id)
                                        }
                                        disabled={enviandoAvaliacao}
                                        className="w-full h-9 bg-green-600 hover:bg-green-700 text-xs font-bold"
                                      >
                                        Confirmar Recebimento
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
