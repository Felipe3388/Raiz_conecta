"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScaleWidget } from "@/components/balanca/ScaleWidget";
import { PageHeading } from "@/components/ui/PageHeading";

// Do jeito que o app faz, na ordem em que acontece no dia da entrega.
const STEPS = [
  { title: "Abra Entregas no app", text: "Os pedidos aparecem por dia de entrega e por mercado, com o total de cada produto para separar." },
  { title: "Toque em Iniciar pesagem", text: "O app diz o mercado e o produto, mostra o que foi pedido e a faixa aceita (2% para mais ou para menos)." },
  { title: "Coloque o produto na balança", text: "Quando o peso fica parado 5 segundos dentro da faixa, o app registra sozinho e chama o próximo." },
  { title: "Entregue à logística", text: "Com todos os produtos pesados, o pedido segue para a entrega. Fora da faixa, o app pede confirmação." },
];

// Entregas: a pesagem acontece no celular, perto da balança. No computador o produtor vê como funciona e acompanha
// a balança conectada; o registro das entregas por pedido ainda não tem rota no servidor.
export default function EntregasPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Entregas" subtitle="Separe e pese os pedidos no dia da entrega, pelo aplicativo." />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section aria-labelledby="como-pesar" className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h2 id="como-pesar">Como pesar um pedido</h2>
          <ol className="mt-6 space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-green-600 text-white font-display font-bold" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3 className="!text-base !font-bold !text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed mt-0.5">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <div className="h-44"><ScaleWidget /></div>
          <Link href="/produtor/balancas" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-green-600 transition-colors">
            <span className="flex-1">
              <span className="block font-bold text-gray-900">Minha balança</span>
              <span className="block text-sm text-gray-600">Conectar, trocar ou ver o peso ao vivo</span>
            </span>
            <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />
          </Link>
          <div className="hidden xl:block rounded-2xl bg-mata px-8 pt-8 overflow-hidden">
            <div className="rounded-t-[2rem] bg-gray-950 px-2 pt-2">
              <Image src="/landing/app-pesagem.png" alt="A tela de pesagem do app, com a faixa aceita e o peso estabilizando" width={780} height={1000} sizes="260px" className="rounded-t-[1.6rem] w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
