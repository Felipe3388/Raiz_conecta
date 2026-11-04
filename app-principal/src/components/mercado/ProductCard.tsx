"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL } from "@/lib/format/currency";
import { MAX_QTD } from "@/lib/mercado/cart";
import { categoryIcon, type CatalogProduct } from "@/lib/mercado/catalog";

interface ProductCardProps {
  product: CatalogProduct;
  // Quantidade que já está na cotação (0 = fora).
  inCart: number;
  onAdd: (product: CatalogProduct, qtd: number) => void;
}

export function ProductCard({ product, inCart, onAdd }: ProductCardProps) {
  const [qtd, setQtd] = useState(1);
  const unit = product.unidadePadrao || "Kg";
  const name = product.nome ?? "Produto";

  function add() {
    onAdd(product, qtd);
    toast.success(`${qtd} ${unit} de ${name} na cotação.`);
    setQtd(1);
  }

  return (
    <article className={`border-2 rounded-2xl p-5 text-center transition-all bg-white flex flex-col justify-between ${inCart > 0 ? "border-green-500 shadow-md ring-4 ring-green-50" : "border-gray-100 hover:border-green-300"}`}>
      <div>
        {product.imagemUrl ? (
          <Image src={product.imagemUrl} alt="" width={96} height={96} quality={80} className="w-24 h-24 object-cover rounded-full mx-auto mb-4 shadow-sm border-4 border-gray-50" />
        ) : (
          <div className="text-6xl mb-4 select-none" aria-hidden="true">{categoryIcon(product.tipo)}</div>
        )}

        <h3 className="font-extrabold text-lg text-gray-800 mb-1">{name}</h3>
        {product.tipo && <p className="text-xs text-gray-500 mb-3 bg-gray-100 inline-block px-2 py-1 rounded-full">{product.tipo}</p>}

        <div className="bg-gray-50 p-2 rounded-lg mb-4">
          <p className="text-xs text-gray-600 font-semibold mb-1">Preço de referência</p>
          <p className="text-xl text-green-700 font-black">
            {formatBRL(product.preco ?? 0)} <span className="text-xs text-gray-500 font-normal">/ {unit}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {inCart > 0 && <p className="text-xs font-bold text-green-700">{inCart} {unit} na cotação</p>}
        <QuantityInput value={qtd} onChange={setQtd} min={1} max={MAX_QTD} itemName={name} unit={unit} onEnter={add} />
        <Button onClick={add} className="w-full h-11 font-bold"><Plus size={18} aria-hidden="true" /> Adicionar</Button>
      </div>
    </article>
  );
}
