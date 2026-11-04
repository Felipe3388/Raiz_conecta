"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL, formatQuantity } from "@/lib/format/currency";
import type { MuralItem } from "@/lib/produtor/mural";

interface DemandCardProps {
  item: MuralItem;
  // Chamado com a quantidade escolhida; devolve true quando a oferta foi registrada.
  onOffer?: (item: MuralItem, quantity: number) => Promise<boolean>;
}

// Um pedido de mercado em cartão (celular e tablet): o que ele precisa, quanto já foi garantido e, se ainda dá,
// quanto o produtor envia. No computador a mesma informação vai numa linha da tabela (OffersTable).
export function DemandCard({ item, onOffer }: DemandCardProps) {
  const [quantity, setQuantity] = useState(0);
  const [sending, setSending] = useState(false);
  const mine = item.minhaQuantidade !== null;

  async function offer() {
    if (!onOffer) return;
    setSending(true);
    const ok = await onOffer(item, quantity);
    setSending(false);
    if (ok) setQuantity(0);
  }

  return (
    <article className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 ${mine ? "border-green-300" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display !text-2xl !font-bold !text-gray-900">{item.produto}</h3>
          <p className="text-sm text-gray-600">Pedido de {formatQuantity(item.quantidade, item.unidade)}</p>
        </div>
        <p className="text-right">
          <span className="block font-bold text-gray-900 tabular-nums">{formatBRL(item.precoMedio)}</span>
          <span className="block text-xs text-gray-500">por {item.unidade}</span>
        </p>
      </div>

      <div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, item.percentual)}%` }} />
        </div>
        <p className="mt-1.5 text-sm text-gray-600 tabular-nums">
          {formatQuantity(item.atendido, item.unidade)} garantidos
          {!mine && item.faltante > 0 ? `, faltam ${formatQuantity(item.faltante, item.unidade)}` : ""}
        </p>
      </div>

      {mine ? (
        <p className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-green-800 font-semibold">
          <CheckCircle2 size={18} aria-hidden="true" /> Você garantiu {formatQuantity(item.minhaQuantidade ?? 0, item.unidade)}
        </p>
      ) : onOffer ? (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Quanto você envia?</p>
          <div className="flex items-center gap-2">
            <QuantityInput value={quantity} onChange={setQuantity} min={0} max={item.faltante} itemName={item.produto} unit={item.unidade} className="flex-1" />
            <Button onClick={offer} isLoading={sending} disabled={quantity <= 0 || quantity > item.faltante} className="h-12 px-6">
              Ofertar
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
