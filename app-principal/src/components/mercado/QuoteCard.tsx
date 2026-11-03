"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { formatQuantity } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/time";
import { api } from "@/lib/http/client";
import { PRAZO_CANCELAMENTO_DIAS_UTEIS, podeCancelar, type Pedido } from "@/lib/mercado/pedidos";

interface QuoteCardProps {
  pedido: Pedido;
  onChanged: () => void;
}

const STATUS: Record<string, { label: string; variant: "info" | "success" | "danger" | "neutral" }> = {
  ABERTA: { label: "Em andamento", variant: "info" },
  CONCLUIDA: { label: "Concluída", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
};

export function QuoteCard({ pedido, onChanged }: QuoteCardProps) {
  const [rating, setRating] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const status = STATUS[pedido.status] ?? { label: pedido.status, variant: "neutral" as const };
  const canCancel = podeCancelar(pedido);

  return (
    <Card flat className="p-6 shadow-sm">
      <div className="flex justify-between items-start gap-4 mb-6 border-b border-gray-100 pb-4">
        <div className="min-w-0">
          <h3 className="text-2xl font-black text-gray-900 break-words">{pedido.produto}</h3>
          <p className="text-sm text-gray-500 mt-1">Disparado em {formatDate(pedido.criadoEm)}</p>
        </div>
        <div className="text-right shrink-0">
          <Badge variant={status.variant}>{status.label}</Badge>
          <p className="text-xl font-black text-gray-800 mt-2">{formatQuantity(pedido.quantidade, pedido.unidade)}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-gray-600">Volume garantido: <span className="text-blue-600">{formatQuantity(pedido.garantido, pedido.unidade)}</span></span>
          <span className="text-gray-500">{pedido.percentual}% preenchido</span>
        </div>
        <div
          className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-label={`Volume garantido de ${pedido.produto}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pedido.percentual}
        >
          <div className={`h-3 rounded-full transition-all duration-500 ${pedido.status === "CONCLUIDA" || pedido.percentual >= 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pedido.percentual}%` }} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" aria-hidden="true" /> Produtores que fecharam negócio
        </h4>
        {pedido.ofertas.length === 0 ? (
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-center border border-dashed border-gray-200 flex items-center justify-center gap-2">
            <Clock size={14} aria-hidden="true" /> Nenhum produtor ofertou ainda. Aguardando...
          </p>
        ) : (
          <ul className="space-y-3">
            {pedido.ofertas.map((oferta) => {
              const delivered = oferta.statusEntrega === "ENTREGUE";
              return (
                <li key={oferta.id} className={`flex flex-col p-3 rounded-lg border ${delivered ? "bg-green-50/50 border-green-200" : "bg-blue-50/50 border-blue-100"}`}>
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${delivered ? "text-green-900" : "text-blue-900"}`}>{oferta.produtor}</p>
                      <p className="text-[11px] text-gray-500 uppercase">Garantido: <span className="font-bold">{formatQuantity(oferta.quantidade, pedido.unidade)}</span></p>
                    </div>
                    {delivered ? (
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="success">Entregue</Badge>
                        {oferta.nota ? <StarRating value={oferta.nota} size={14} label={`Nota para ${oferta.produtor}`} /> : null}
                      </div>
                    ) : pedido.status !== "CANCELADA" ? (
                      <Button onClick={() => setRating(rating === oferta.id ? null : oferta.id)} variant="outline" aria-expanded={rating === oferta.id} className="h-10 px-3 text-xs font-bold">
                        Avaliar
                      </Button>
                    ) : null}
                  </div>

                  {rating === oferta.id && !delivered && (
                    <RatingForm ofertaId={oferta.id} producer={oferta.produtor} onDone={() => { setRating(null); onChanged(); }} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canCancel && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setCancelling(true)} className="rc-danger-btn-ghost w-full h-11">
            <XCircle size={14} aria-hidden="true" /> Cancelar este pedido
          </button>
        </div>
      )}
      {pedido.status === "CANCELADA" && (
        <p className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-red-600 text-sm font-bold">
          <XCircle size={16} aria-hidden="true" /> Pedido cancelado
        </p>
      )}

      <Modal isOpen={cancelling} onClose={() => setCancelling(false)} title="Cancelar pedido">
        {cancelling && <CancelForm pedido={pedido} onClose={() => setCancelling(false)} onDone={onChanged} />}
      </Modal>
    </Card>
  );
}

function RatingForm({ ofertaId, producer, onDone }: { ofertaId: string; producer: string; onDone: () => void }) {
  const [nota, setNota] = useState(5);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const result = await api("/api/mercado/avaliar", { method: "PATCH", json: { ofertaId, nota } });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Entrega confirmada e produtor avaliado!");
    onDone();
  }

  return (
    <div className="mt-2 pt-3 border-t border-blue-200">
      <p className="text-xs font-bold text-gray-700 mb-2">Como foi o produto e a entrega de {producer}?</p>
      <div className="mb-3"><StarRating value={nota} onChange={setNota} label={`Nota para ${producer}`} /></div>
      <Button isLoading={busy} onClick={confirm} className="w-full h-10 text-xs">Confirmar recebimento</Button>
    </div>
  );
}

function CancelForm({ pedido, onClose, onDone }: { pedido: Pedido; onClose: () => void; onDone: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await api<{ reembolso?: string }>("/api/mercado/cancelar", {
      method: "PATCH",
      json: { demandaId: pedido.id, motivo: motivo.trim() || "Cancelamento solicitado pelo mercado" },
    });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Pedido cancelado.", { description: result.data?.reembolso });
    onDone();
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <div className="rc-banner rc-banner-red !p-3 text-sm">
        <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
        <p>O cancelamento vale em até <strong>{PRAZO_CANCELAMENTO_DIAS_UTEIS} dias úteis</strong> após o pedido e não pode ser desfeito. As ofertas dos produtores também são canceladas.</p>
      </div>
      <p className="text-sm text-gray-600">Pedido: <strong>{pedido.produto}</strong> · {formatQuantity(pedido.quantidade, pedido.unidade)}</p>
      <div>
        <label htmlFor="motivo-cancelamento" className="text-sm font-semibold text-gray-700 block mb-1.5">Motivo (opcional)</label>
        <textarea
          id="motivo-cancelamento"
          rows={3}
          maxLength={300}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: estoque já abastecido, produto não necessário..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-300 text-gray-600">Voltar</Button>
        <Button type="submit" isLoading={busy} className="flex-1 bg-red-600 hover:bg-red-700"><XCircle size={16} aria-hidden="true" /> Cancelar pedido</Button>
      </div>
    </form>
  );
}
