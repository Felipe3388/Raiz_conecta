"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatBRL, formatQuantity } from "@/lib/format/currency";
import type { MuralItem } from "@/lib/produtor/mural";

type OfferFn = (item: MuralItem, quantity: number) => Promise<boolean>;

function Progress({ item }: { item: MuralItem }) {
  return (
    <div className="min-w-40">
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, item.percentual)}%` }} />
      </div>
      <p className="mt-1.5 text-sm text-gray-600 tabular-nums">
        {formatQuantity(item.atendido, item.unidade)} de {formatQuantity(item.quantidade, item.unidade)} garantidos
      </p>
    </div>
  );
}

function OpenRow({ item, onOffer }: { item: MuralItem; onOffer: OfferFn }) {
  const [quantity, setQuantity] = useState(0);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    const ok = await onOffer(item, quantity);
    setSending(false);
    if (ok) setQuantity(0);
  }

  return (
    <tr className="align-middle">
      <td className="py-4 pl-5 pr-4">
        <p className="font-bold text-gray-900">{item.produto}</p>
        <p className="text-sm text-gray-500">Faltam {formatQuantity(item.faltante, item.unidade)}</p>
      </td>
      <td className="py-4 pr-4"><Progress item={item} /></td>
      <td className="py-4 pr-4 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap">{formatBRL(item.precoMedio)} / {item.unidade}</td>
      <td className="py-4 pr-5">
        <div className="flex items-center justify-end gap-2">
          <QuantityInput value={quantity} onChange={setQuantity} min={0} max={item.faltante} itemName={item.produto} unit={item.unidade} className="w-40 h-11" onEnter={() => quantity > 0 && void send()} />
          <Button onClick={send} isLoading={sending} disabled={quantity <= 0 || quantity > item.faltante} className="h-11 px-5">
            Ofertar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function MineRow({ item }: { item: MuralItem }) {
  const mine = item.minhaQuantidade ?? 0;
  const closed = item.status === "CONCLUIDA";
  return (
    <tr className="align-middle">
      <td className="py-4 pl-5 pr-4">
        <p className="font-bold text-gray-900">{item.produto}</p>
        <p className="text-sm text-gray-500">Pedido de {formatQuantity(item.quantidade, item.unidade)}</p>
      </td>
      <td className="py-4 pr-4"><Progress item={item} /></td>
      <td className="py-4 pr-4 text-right tabular-nums whitespace-nowrap">
        <p className="font-bold text-gray-900">{formatQuantity(mine, item.unidade)}</p>
        <p className="text-sm text-gray-500">{formatBRL(mine * item.precoMedio)}</p>
      </td>
      <td className="py-4 pr-5 text-right">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${closed ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-700"}`}>
          {closed && <CheckCircle2 size={15} aria-hidden="true" />} {closed ? "Pedido completo" : "Esperando outros produtores"}
        </span>
      </td>
    </tr>
  );
}

// Os pedidos em tabela, para o computador: uma linha por pedido, com o andamento e a oferta na própria linha.
// No celular a tela usa os cartões (DemandCard), como no app.
export function OffersTable({ items, mode, onOffer }: { items: MuralItem[]; mode: "responder" | "minhas"; onOffer: OfferFn }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <caption className="sr-only">{mode === "responder" ? "Pedidos esperando oferta" : "Pedidos em que você ofertou"}</caption>
        <thead>
          <tr className="text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
            <th scope="col" className="py-3 pl-5 pr-4 font-semibold">Produto</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Andamento</th>
            <th scope="col" className="py-3 pr-4 font-semibold text-right">{mode === "responder" ? "Preço médio" : "Sua parte"}</th>
            <th scope="col" className="py-3 pr-5 font-semibold text-right">{mode === "responder" ? "Quanto você envia" : "Situação"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (mode === "responder" ? <OpenRow key={item.id} item={item} onOffer={onOffer} /> : <MineRow key={item.id} item={item} />))}
        </tbody>
      </table>
    </div>
  );
}
