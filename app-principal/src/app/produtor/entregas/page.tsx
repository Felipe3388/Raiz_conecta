"use client";

import Link from "next/link";
import { ChevronRight, Package, Radio, Scale, Smartphone } from "lucide-react";
import { PageHeading } from "@/components/ui/PageHeading";

// Entregas e pesagem ainda dependem da balança e do app do celular: o site mostra para onde ir, sem fingir dados.
export default function EntregasPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Entregas" subtitle="Separe e pese os pedidos no dia da entrega." />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl shrink-0">
          <Smartphone size={36} />
        </div>
        <div className="space-y-3">
          <h2>A pesagem é feita no aplicativo</h2>
          <p className="text-gray-600 leading-relaxed">
            No dia da entrega, abra o aplicativo Raiz Conecta no celular, entre em <b>Entregas</b> e toque em{" "}
            <b>Iniciar pesagem</b>. O app diz o que pesar, quanto o mercado pediu e a faixa aceita, e registra o peso
            quando a balança estabiliza.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><Package size={17} className="text-green-700" /> Pedidos separados por mercado e por dia de entrega</li>
            <li className="flex items-center gap-2"><Scale size={17} className="text-green-700" /> Balança conectada ou simulador de teste</li>
          </ul>
        </div>
      </div>

      <Link href="/produtor/balancas" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="bg-green-50 text-green-700 p-3 rounded-xl shrink-0"><Radio size={24} aria-hidden="true" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900">Ver o peso ao vivo e gerenciar balanças</p>
          <p className="text-sm text-gray-500">Em Minha balança você conecta a balança e acompanha o peso pelo computador.</p>
        </div>
        <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </Link>
    </div>
  );
}
