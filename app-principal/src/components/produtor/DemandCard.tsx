"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL, formatQuantity } from "@/lib/format/currency";
import type { MuralItem } from "@/lib/produtor/mural";

interface DemandCardProps {
  item: MuralItem;
  // Chamado com a quantidade escolhida; devolve true quando a oferta foi registrada.
  onOffer?: (item: MuralItem, quantity: number) => Promise<boolean>;
}

// Um pedido de mercado: o que ele precisa, o quanto já foi garantido e, se ainda dá, quanto o produtor envia.
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
    <Card flat className={`rc-demand-card ${mine ? "rc-demand-card-mine" : "rc-demand-card-default"}`}>
      <div className="mb-5">
        <div className="flex justify-between items-start mb-4 gap-3">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mercado precisa de</span>
            <h3 className="text-2xl font-black text-gray-900">{item.produto}</h3>
          </div>
          <Badge variant={item.status === "CONCLUIDA" ? "success" : "warning"}>
            {item.status === "CONCLUIDA" ? "Fechada" : "Aberta"}
          </Badge>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Estimativa</p>
            <p className="text-lg font-black text-green-700">
              {formatBRL(item.precoMedio)} <span className="text-xs text-gray-500 font-normal">/ {item.unidade}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Pedido</p>
            <p className="text-lg font-black text-gray-800">{formatQuantity(item.quantidade, item.unidade)}</p>
          </div>
        </div>

        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-gray-500">
            Garantido: <span className="text-green-700">{formatQuantity(item.atendido, item.unidade)}</span>
          </span>
          {!mine && item.faltante > 0 && <span className="text-amber-700">Faltam: {formatQuantity(item.faltante, item.unidade)}</span>}
        </div>
        <ProgressBar value={item.percentual} size="md" />
      </div>

      <div className="pt-5 border-t border-gray-100">
        {mine ? (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
            <CheckCircle className="text-blue-700 mx-auto mb-1" size={22} />
            <span className="font-black text-blue-900 text-sm">
              Você garantiu {formatQuantity(item.minhaQuantidade ?? 0, item.unidade)}!
            </span>
          </div>
        ) : (
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Quanto você enviará?</label>
            <div className="flex items-center gap-2">
              <QuantityInput value={quantity} onChange={setQuantity} min={0} max={item.faltante} itemName={item.produto} unit={item.unidade} className="w-1/2" />
              <Button
                onClick={offer}
                isLoading={sending}
                disabled={!quantity || quantity <= 0 || quantity > item.faltante}
                className="w-1/2 h-12 font-bold"
              >
                Ofertar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
