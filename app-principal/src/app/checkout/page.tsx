/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // O superpoder do Next.js para imagens
import { toast } from "sonner"; // Notificações profissionais
import {
  MapPin,
  ShieldCheck,
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge"; // Nosso componente de status

export default function CheckoutConfirmacao() {
  const router = useRouter();
  const [mercado, setMercado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [carrinho, setCarrinho] = useState<any[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const email = localStorage.getItem("userEmail");
      if (!email) return router.push("/login");

      try {
        const resMercado = await fetch(`/api/mercado/perfil?email=${email}`);
        if (resMercado.ok) setMercado(await resMercado.json());

        const carrinhoSalvo = localStorage.getItem("carrinhoRaiz");
        if (carrinhoSalvo) {
          const parsed = JSON.parse(carrinhoSalvo);
          setCarrinho(parsed);
          if (parsed.length === 0) router.push("/catalogo");
        } else {
          router.push("/catalogo");
        }
      } catch (e) {
        toast.error("Erro ao carregar dados do carrinho.");
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [router]);

  const atualizarCarrinho = (novoCarrinho: any[]) => {
    setCarrinho(novoCarrinho);
    if (novoCarrinho.length === 0) {
      localStorage.removeItem("carrinhoRaiz");
      router.push("/catalogo");
    } else {
      localStorage.setItem("carrinhoRaiz", JSON.stringify(novoCarrinho));
    }
  };

  const alterarQuantidade = (id: number, novaQtd: string) => {
    const qtdNum = parseInt(novaQtd);
    if (isNaN(qtdNum) || qtdNum < 1) return;
    atualizarCarrinho(
      carrinho.map((item) =>
        item.id === id ? { ...item, qtd: qtdNum } : item,
      ),
    );
  };

  const removerItem = (id: number) => {
    atualizarCarrinho(carrinho.filter((item) => item.id !== id));
  };

  const limparCarrinho = () => {
    if (confirm("Tem certeza que deseja cancelar esta cotação?")) {
      localStorage.removeItem("carrinhoRaiz");
      toast.info("Cotação cancelada e esvaziada.");
      router.push("/catalogo");
    }
  };

  const totalEstimado = carrinho.reduce(
    (acc, item) => acc + item.precoEstimado * item.qtd,
    0,
  );

  const dispararPedido = async () => {
    setEnviando(true);

    const payloadCarrinho = carrinho.map((item) => ({
      nome: item.nome,
      qtd: item.qtd,
      unidade: "Kg",
      precoEstimado: item.precoEstimado,
    }));

    try {
      const res = await fetch("/api/mercado/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailMercado: mercado.email,
          carrinho: payloadCarrinho,
        }),
      });

      if (res.ok) {
        toast.success("Cotação enviada com sucesso!", {
          description: "Os produtores da região foram notificados."
        });
        localStorage.removeItem("carrinhoRaiz");
        router.push("/catalogo");
      } else {
        toast.error("Erro ao disparar pedido. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar enviar a demanda.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-bold text-green-700 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin mb-4" size={40} />
        Preparando Cotação Final...
      </div>
    );

  if (!mercado) return <div className="p-20 text-center">Acesso Negado.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* BOTÕES DE NAVEGAÇÃO DE TOPO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => router.push("/catalogo")}
            variant="ghost"
            className="flex items-center text-gray-500 hover:text-green-700 font-bold transition-colors w-max bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="mr-2" size={20} /> Voltar e adicionar mais
          </Button>
          <Button
            onClick={limparCarrinho}
            variant="ghost"
            className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 font-bold transition-colors w-max px-4 py-2 rounded-xl"
          >
            <Trash2 className="mr-2" size={20} /> Cancelar Pedido
          </Button>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <Send className="text-green-600" size={32} /> Confirmar Disparo de Cotação
        </h1>

        <div className="grid md:grid-cols-3 gap-8">

          {/* LADO ESQUERDO: Itens para Revisão */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 bg-white shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                Revise o Volume Solicitado ({carrinho.length} itens)
              </h2>

              <div className="space-y-4">
                {carrinho.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group"
                  >
                    <div className="flex items-center gap-4">

                      {/* RENDERIZA FOTO REAL OU O EMOJI */}
                      {item.imagemUrl ? (
                        <Image
                          src={item.imagemUrl}
                          alt={item.nome}
                          width={56}
                          height={56}
                          className="w-14 h-14 object-cover rounded-xl shadow-sm border border-gray-200 bg-white"
                        />
                      ) : (
                        <div className="text-4xl bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                          {item.icone || "📦"}
                        </div>
                      )}

                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {item.nome}
                        </p>
                        <p className="text-sm text-gray-500">
                          Estimativa: R$ {item.precoEstimado.toFixed(2)}/kg
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
                      <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
                        <input
                          type="number"
                          min="1"
                          value={item.qtd}
                          onChange={(e) =>
                            alterarQuantidade(item.id, e.target.value)
                          }
                          className="w-16 text-center font-black text-lg bg-transparent border-none outline-none focus:ring-0"
                        />
                        <span className="text-xs font-bold text-gray-400 uppercase mr-2 select-none">
                          kg
                        </span>
                      </div>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" /> Logística: Seu Endereço Atual
              </h2>
              <div className="text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="font-bold text-lg text-blue-900">
                  {mercado.nomeFantasia || mercado.razaoSocial}
                </p>
                <p>
                  {mercado.rua}, {mercado.numero} - {mercado.bairro}
                </p>
                <p>
                  {mercado.cidade} / {mercado.estado} - CEP: {mercado.cep}
                </p>
              </div>
            </Card>
          </div>

          {/* LADO DIREITO: Resumo Financeiro */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-500 sticky top-8 animate-in slide-in-from-right-8 fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingCart size={20} className="text-green-600" /> Resumo do Disparo
              </h2>

              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Estimado</span>
                  <span>R$ {totalEstimado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxa de Sistema</span>
                  <Badge variant="success">Isento</Badge>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-gray-900 font-bold">
                  Total Estimativa
                </span>
                <span className="text-3xl font-black text-green-700">
                  R$ {totalEstimado.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={dispararPedido}
                isLoading={enviando}
                className="w-full h-16 text-lg font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
              >
                {!enviando && <ShieldCheck size={24} />}
                {enviando ? "Processando..." : "Confirmar Disparo"}
              </Button>

              <div className="mt-6 flex items-start gap-3 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p>
                  Lembre-se: O preço final será estabelecido quando você{" "}
                  <strong>aceitar a oferta de um Produtor Rural</strong> através
                  do painel de controle.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}