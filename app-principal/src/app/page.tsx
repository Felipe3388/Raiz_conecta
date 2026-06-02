/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Truck,
  TrendingUp,
  ArrowRight,
  Store,
  Tractor,
  Handshake,
  CheckCircle,
  Apple,
  UsersRound,
  Network,
} from "lucide-react";

export default function HomePage() {
  const [roleLogado, setRoleLogado] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleLogado(role);
    }
  }, []);

  const getLinkDoPainel = () => {
    if (roleLogado === "admin") return "/admin";
    if (roleLogado === "mercado") return "/catalogo"; // Atualizado para a rota nova
    return "/produtor";
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">

      {/* HERO SECTION*/}

      <section className="relative pt-24 pb-32 overflow-hidden" id="inicio">
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-green-50 to-white -z-10" />
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Mensagem Raiz Conecta */}
            <div className="lg:w-1/2 text-center lg:text-left z-10">
              <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-sm font-bold tracking-wider mb-6 border border-green-200">
                O FUTURO DO AGRONEGÓCIO
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                Conectando o Produtor <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-500">
                  Direto ao Mercado
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
                A plataforma B2B que revoluciona a compra e venda de hortifruti
                no atacado. Negociação direta, transparente e sem
                atravessadores.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {roleLogado ? (
                  <Link
                    href={getLinkDoPainel()}
                    className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2 text-lg cursor-pointer"
                  >
                    Acessar meu Painel <ArrowRight size={20} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Store size={20} /> Sou um Mercado
                    </Link>
                    <Link
                      href="/login"
                      className="px-8 py-4 bg-white text-green-700 border-2 border-green-200 rounded-xl font-bold shadow-sm hover:border-green-600 hover:bg-green-50 hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Tractor size={20} /> Sou Produtor Rural
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Imagem Hero */}
            <div className="lg:w-1/2 w-full relative z-10">
              <div className="relative rounded-3xl shadow-2xl overflow-hidden aspect-square md:aspect-video lg:aspect-4/3 border-8 border-white bg-gray-100">
                <img
                  src="/LP_MercadoEstoque.jpg"
                  alt="Hortifruti fresco no mercado"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA (PASSO A PASSO)*/}

      <section className="py-24 bg-gray-900 text-white" id="como-funciona">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">
              Como o Raiz Conecta funciona?
            </h2>
            <p className="text-gray-300 text-lg">
              Um ecossistema desenhado para agilidade e lucro de ambos os lados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-700 z-0"></div>

            {/* Passo 1 */}

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-800 border-4 border-gray-700 rounded-full flex items-center justify-center mb-6 shadow-xl text-blue-400">
                <Store size={40} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                1. O Mercado Solicita
              </h3>
              <p className="text-gray-400">
                O comprador acessa o catálogo e dispara uma cotação indicando
                quantos Quilos precisa de cada produto.
              </p>
            </div>

            {/* Passo 2 */}

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-800 border-4 border-gray-700 rounded-full flex items-center justify-center mb-6 shadow-xl text-green-400">
                <Tractor size={40} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                2. O Produtor Oferta
              </h3>
              <p className="text-gray-400">
                Os produtores da região são notificados e enviam propostas
                fracionadas (ex: Eu garanto 50kg da sua lista).
              </p>
            </div>

            {/* Passo 3 */}

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-500 border-4 border-green-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-900/50 text-white">
                <Handshake size={40} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                3. Carga Fechada!
              </h3>
              <p className="text-gray-400">
                O sistema une as ofertas, a carga do mercado é completada 100% e
                as entregas são agendadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE E MISSÃO */}

      <section className="py-24 bg-white" id="sobre">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-green-50 rounded-[3rem] p-8 md:p-16 lg:p-20 overflow-hidden relative">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="lg:w-1/2 w-full order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden shadow-2xl aspect-4/5 lg:aspect-square">
                  <img
                    src="/LP_ProdutorNegocio.jpg"
                    alt="Produtor rural na colheita"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="lg:w-1/2 order-1 lg:order-2">
                <h2 className="font-black text-gray-900 mb-6 text-3xl md:text-4xl leading-tight">
                  Revolucionando o caminho do{" "}
                  <span className="text-green-600">hortifruti</span> até a
                  prateleira.
                </h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  A nossa missão no <strong>Raiz Conecta</strong> é empoderar o
                  produtor local e garantir o melhor preço para o varejista. Nós
                  eliminamos a complexidade e os intermediários que encarecem a
                  comida que chega à mesa do brasileiro.
                </p>
                <ul className="space-y-4 mb-8 text-gray-700 font-medium">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} /> Fim dos
                    atravessadores abusivos.
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} /> Preço
                    justo para quem planta.
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />{" "}
                    Alimentos mais frescos no mercado.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}

      <section
        className="py-24 bg-gray-50 border-t border-gray-200"
        id="funcionalidades"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Vantagens da Plataforma
            </h2>
            <p className="text-gray-600 text-lg">
              Tudo que você precisa para gerenciar suas compras e vendas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Sustentabilidade Real",
                text: "Reduza o desperdício de alimentos. Os mercados compram exatamente o que precisam e os produtores escoam 100% da safra.",
              },
              {
                icon: Network,
                title: "Gestão Inteligente",
                text: "Diversos produtores podem se unir pelo nosso sistema para atender o volume gigantesco de um grande mercado.",
              },
              {
                icon: UsersRound,
                title: "Transparência Total",
                text: "Com o painel de auditoria e perfis verificados, você sabe exatamente com quem está negociando e acompanha o status em tempo real.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-100 hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex justify-center items-center mb-6 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <item.icon size={32} />
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CTA FINAL */}
      
      {!roleLogado && (
        <section className="py-20 bg-green-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Pronto para digitalizar seus negócios?
            </h2>
            <p className="text-green-100 mb-10 text-lg md:text-xl max-w-2xl mx-auto">
              Junte-se a dezenas de mercados e produtores que já estão lucrando
              mais com o Raiz Conecta.
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-5 bg-white text-green-800 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform text-xl"
            >
              Criar Minha Conta Grátis
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
