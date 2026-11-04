"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { useConfirm } from "@/components/ui/useConfirm";
import { formatBRL } from "@/lib/format/currency";
import { categoryIcon } from "@/lib/mercado/catalog";
import { MAX_QTD, type CartItem } from "@/lib/mercado/cart";

interface CartPanelProps {
  cart: CartItem[];
  total: number;
  onSetQty: (id: number, qtd: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}

// A cotação em montagem (lado direito do catálogo). Mostra a estimativa; o preço final nasce quando o mercado aceita uma oferta.
export function CartPanel({ cart, total, onSetQty, onRemove, onClear }: CartPanelProps) {
  const { confirm, dialog } = useConfirm();

  return (
    <section id="cotacao" aria-labelledby="cotacao-titulo" className="bg-white p-6 rounded-2xl shadow-xl border border-green-100 lg:sticky lg:top-24">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 id="cotacao-titulo" className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <ShoppingCart className="text-green-600" aria-hidden="true" /> Cotação
        </h2>
        <button
          type="button"
          onClick={() => confirm({ title: "Esvaziar a cotação?", description: "Todos os produtos escolhidos saem da lista.", confirmLabel: "Esvaziar", variant: "danger", run: () => { onClear(); toast.info("Cotação esvaziada."); } })}
          className="grid h-10 w-10 place-items-center text-red-500 hover:bg-red-50 rounded-lg"
          aria-label="Esvaziar a cotação"
        >
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>

      <ul className="space-y-4 mb-8 max-h-112 overflow-y-auto pr-2">
        {cart.map((item) => (
          <li key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              {item.imagemUrl ? (
                <Image src={item.imagemUrl} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-full shadow-sm border border-gray-200" />
              ) : (
                <span className="text-3xl bg-white p-2 rounded-xl border border-gray-200" aria-hidden="true">{categoryIcon(null)}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base text-gray-900 leading-tight">{item.nome}</p>
                <p className="text-xs text-gray-500 mt-1">{formatBRL(item.preco)} / {item.unidade}</p>
              </div>
              <button type="button" onClick={() => onRemove(item.id)} aria-label={`Tirar ${item.nome} da cotação`} className="grid h-10 w-10 place-items-center text-gray-400 hover:text-red-500 rounded-lg">
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <span className="text-sm text-gray-600 font-semibold ml-2">{item.unidade}</span>
              <QuantityInput value={item.qtd} onChange={(qtd) => onSetQty(item.id, qtd)} min={1} max={MAX_QTD} itemName={item.nome} className="w-36 h-10 border-0 shadow-none" />
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t-2 border-dashed border-gray-200 pt-5 mb-6">
        <div className="flex justify-between items-center text-xl font-black text-gray-900">
          <span>Estimativa total</span>
          <span className="text-green-700 whitespace-nowrap">{formatBRL(total)}</span>
        </div>
      </div>

      <Link href="/checkout" className="inline-flex w-full h-16 items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-lg font-bold shadow-sm hover:shadow-md transition-all">
        Revisar e disparar <ArrowRight size={22} aria-hidden="true" />
      </Link>
      {dialog}
    </section>
  );
}
