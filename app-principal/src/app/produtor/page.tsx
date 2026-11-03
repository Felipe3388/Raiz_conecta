"use client";

import Link from "next/link";
import { BarChart3, CheckCircle2, ChevronRight, Clock, ListChecks, Package, Sprout } from "lucide-react";
import { PageHeading } from "@/components/ui/PageHeading";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { formatBRL, formatQuantity } from "@/lib/format/currency";
import { barWidths, respondFirst, revenueByProduct } from "@/lib/produtor/dashboard";

// Início: um resumo simples da atividade do produtor, com atalhos para cada tela (o mesmo "Meu Painel" do app).
export default function PainelPage() {
  const { produtor, mural, produtosNoCatalogo, muralError, reloadMural } = useProdutor();

  if (muralError && !mural) {
    return (
      <div className="rc-empty-state">
        <h3 className="rc-empty-title">Não foi possível carregar o painel</h3>
        <p className="rc-empty-desc">Confira a conexão e tente de novo.</p>
        <button onClick={() => void reloadMural()} className="mt-5 font-bold text-green-700 hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }
  if (!mural) return <p className="text-sm text-gray-500">Carregando...</p>;

  const { resumo } = mural;
  const rows = revenueByProduct(mural.minhas);
  const widths = barWidths(rows);
  const urgent = respondFirst(mural.mural);

  return (
    <div className="space-y-6">
      <PageHeading title="Meu Painel" subtitle={`Olá, ${produtor.nomeFantasia ?? "produtor"}!`} />

      <div className="rounded-2xl bg-green-700 text-white p-6 md:p-8 shadow-md">
        <p className="font-bold text-sm text-green-50">Receita estimada do que você garantiu</p>
        <p className="text-4xl md:text-5xl font-black tabular-nums mt-1" aria-live="polite">
          {formatBRL(resumo.receitaEstimada)}
        </p>
        <p className="text-sm text-green-50 mt-2">
          {resumo.ofertasFeitas === 0
            ? "Faça ofertas em Ofertas."
            : `${resumo.ofertasFeitas} ${resumo.ofertasFeitas === 1 ? "oferta feita" : "ofertas feitas"}, ${formatQuantity(resumo.quilosGarantidos, "Kg")} garantidos.`}
        </p>
      </div>

      <Link
        href="/produtor/entregas"
        className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all hover:shadow-md"
      >
        <Package size={26} className="text-green-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">Entregas e pesagem</p>
          <p className="text-sm text-gray-500">A pesagem com a balança é feita no aplicativo do celular.</p>
        </div>
        <ChevronRight size={20} className="text-gray-400 shrink-0" />
      </Link>

      <div className="flex gap-3">
        <StatTile icon={Clock} value={resumo.paraResponder} label="Para responder" href="/produtor/ofertas" />
        <StatTile icon={CheckCircle2} value={resumo.ofertasFeitas} label="Ofertas feitas" href="/produtor/ofertas?aba=minhas" />
        <StatTile icon={Sprout} value={produtosNoCatalogo} label="No catálogo" href="/produtor/catalogo" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Receita por produto" icon={BarChart3}>
          {rows.length > 0 ? (
            <ul className="space-y-3">
              {rows.map((row, index) => (
                <li key={row.produto}>
                  <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                    <span>{row.produto}</span>
                    <span className="tabular-nums">{formatBRL(row.receita)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-600" style={{ width: `${widths[index]}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Sem receita ainda.</p>
          )}
        </SectionCard>

        <SectionCard title="Responder primeiro" icon={Clock} tone="amber">
          {urgent.length > 0 ? (
            <ul className="space-y-2">
              {urgent.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/produtor/ofertas"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.produto}</p>
                      <p className="text-xs text-gray-500">Faltam {formatQuantity(item.faltante, item.unidade)}</p>
                    </div>
                    <span className="text-sm font-black text-green-700 tabular-nums shrink-0">
                      {formatBRL(item.precoMedio)} / {item.unidade}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <ListChecks size={28} className="text-green-700" />
              <p className="text-gray-500">
                {produtosNoCatalogo === 0
                  ? "Escolha o que você produz no Catálogo para ver pedidos."
                  : "Nenhum pedido esperando resposta."}
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
