"use client";

import Link from "next/link";
import { BarChart3, CheckCircle2, ChevronRight, Clock, ListChecks, Sprout } from "lucide-react";
import { ScaleWidget } from "@/components/balanca/ScaleWidget";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageLoader } from "@/components/ui/PageLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { formatBRL, formatQuantity } from "@/lib/format/currency";
import { barWidths, respondFirst, revenueByProduct } from "@/lib/produtor/dashboard";
import { greetingFor } from "@/lib/produtor/greeting";

// Início: o mesmo "Meu Painel" do app, arrumado para a tela grande. A receita e a balança lado a lado no topo, os
// números logo abaixo e, em duas colunas, o que responder primeiro e de onde vem a receita.
export default function PainelPage() {
  const { produtor, mural, produtosNoCatalogo, muralError, reloadMural } = useProdutor();

  if (muralError && !mural) {
    return <EmptyState icon={<ListChecks size={56} className="text-gray-300" aria-hidden="true" />} title="Não foi possível carregar o painel" description="Confira a conexão e tente de novo." actionLabel="Tentar de novo" onAction={() => void reloadMural()} />;
  }
  if (!mural) return <PageLoader message="Carregando o painel..." />;

  const { resumo } = mural;
  const rows = revenueByProduct(mural.minhas);
  const widths = barWidths(rows);
  const urgent = respondFirst(mural.mural);
  const name = (produtor.nomeFantasia ?? "").trim() || "produtor";

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${greetingFor(new Date().getHours())}, ${name}`}
        subtitle="Aqui está o resumo das suas vendas e do que espera resposta."
        action={
          resumo.paraResponder > 0 ? (
            <Link href="/produtor/ofertas" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors">
              Responder {resumo.paraResponder} {resumo.paraResponder === 1 ? "pedido" : "pedidos"}
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl bg-green-700 text-white p-6 md:p-7 flex flex-col justify-between gap-6">
          <p className="font-semibold text-green-100">Receita estimada do que você garantiu</p>
          <div>
            <p className="font-display text-5xl md:text-6xl font-extrabold tabular-nums tracking-tight" aria-live="polite">{formatBRL(resumo.receitaEstimada)}</p>
            <p className="text-green-100 mt-2">
              {resumo.ofertasFeitas === 0
                ? "Você ainda não fez ofertas."
                : `${resumo.ofertasFeitas} ${resumo.ofertasFeitas === 1 ? "oferta" : "ofertas"}, ${formatQuantity(resumo.quilosGarantidos, "Kg")} garantidos.`}
            </p>
          </div>
        </div>
        <ScaleWidget />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatTile icon={Clock} value={resumo.paraResponder} label="Para responder" href="/produtor/ofertas" />
        <StatTile icon={CheckCircle2} value={resumo.ofertasFeitas} label="Ofertas feitas" href="/produtor/ofertas?aba=minhas" />
        <StatTile icon={Sprout} value={produtosNoCatalogo} label="No catálogo" href="/produtor/catalogo" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <SectionCard title="Responder primeiro" icon={Clock} tone="amber" action={urgent.length > 0 ? <Link href="/produtor/ofertas" className="text-sm font-bold text-green-700 hover:underline underline-offset-4">Ver todos</Link> : undefined}>
          {urgent.length > 0 ? (
            <ul className="divide-y divide-gray-100 -mx-1">
              {urgent.map((item) => (
                <li key={item.id}>
                  <Link href="/produtor/ofertas" className="flex items-center gap-4 px-1 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">{item.produto}</p>
                      <p className="text-sm text-gray-500">Faltam {formatQuantity(item.faltante, item.unidade)} de {formatQuantity(item.quantidade, item.unidade)}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{formatBRL(item.precoMedio)} / {item.unidade}</span>
                    <ChevronRight size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 py-2">
              {produtosNoCatalogo === 0 ? "Escolha o que você produz no Catálogo para receber pedidos." : "Nenhum pedido esperando resposta agora."}
            </p>
          )}
        </SectionCard>

        <SectionCard title="Receita por produto" icon={BarChart3}>
          {rows.length > 0 ? (
            <ul className="space-y-3.5">
              {rows.map((row, index) => (
                <li key={row.produto}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-gray-800">{row.produto}</span>
                    <span className="font-bold text-gray-900 tabular-nums">{formatBRL(row.receita)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-600" style={{ width: `${widths[index]}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 py-2">A receita aparece aqui quando suas ofertas forem aceitas.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
