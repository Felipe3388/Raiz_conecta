"use client";

import { useEffect } from "react";
import { Scale, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfirm } from "@/components/ui/useConfirm";
import type { AdminScale } from "@/lib/admin/types";
import { timeAgo } from "@/lib/format/time";
import { api } from "@/lib/http/client";

interface ScalesTabProps {
  scales: AdminScale[];
  onChanged: () => void;
}

// O sinal das balanças muda a cada poucos segundos; a aba se atualiza sozinha enquanto está aberta e visível.
const REFRESH_MS = 8_000;

const idForUrl = (scale: AdminScale) => encodeURIComponent(scale.deviceId);

export function ScalesTab({ scales, onChanged }: ScalesTabProps) {
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") onChanged();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [onChanged]);

  function release(scale: AdminScale) {
    confirm({
      title: "Liberar balança",
      description: `A balança "${scale.nome}" será desvinculada de ${scale.emailProdutor} e o histórico de pesagens dela será apagado. Ela volta a ficar livre: para usar de novo, o produtor refaz o pareamento no app.`,
      confirmLabel: "Liberar",
      variant: "warning",
      run: async () => {
        const result = await api(`/api/admin/balancas/${idForUrl(scale)}`, { method: "PATCH", json: { liberar: true } });
        if (!result.ok) return void toast.error(result.error);
        toast.success("Balança liberada.");
        onChanged();
      },
    });
  }

  function remove(scale: AdminScale) {
    confirm({
      title: "Excluir balança",
      description: `Apagar "${scale.nome}" do sistema, com todo o histórico? O módulo deixa de conseguir enviar pesos até ser pareado de novo.`,
      confirmLabel: "Excluir",
      variant: "danger",
      run: async () => {
        const result = await api(`/api/admin/balancas/${idForUrl(scale)}`, { method: "DELETE" });
        if (!result.ok) return void toast.error(result.error);
        toast.info("Balança excluída.");
        onChanged();
      },
    });
  }

  const online = scales.filter((scale) => scale.online).length;
  const free = scales.filter((scale) => !scale.emailProdutor).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="rc-section-title">Balanças</h2>
          <p className="text-sm text-gray-500 mt-0.5" aria-live="polite">
            {scales.length} pareada(s) · {online} com sinal · {free} livre(s)
          </p>
        </div>
      </div>

      {scales.length === 0 ? (
        <EmptyState
          icon={<Scale size={56} className="text-gray-300" aria-hidden="true" />}
          title="Nenhuma balança pareada"
          description="As balanças aparecem aqui sozinhas quando um produtor as adiciona pelo app (Mais → Balança → Adicionar balança)."
        />
      ) : (
        <Card flat className="overflow-hidden">
          <div className="hidden lg:block overflow-x-auto no-scrollbar">
            <table className="rc-table min-w-200">
              <caption className="sr-only">Balanças pareadas</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Balança</th>
                  <th scope="col">Produtor</th>
                  <th scope="col">Sinal</th>
                  <th scope="col">Último peso</th>
                  <th scope="col" className="text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {scales.map((scale) => (
                  <tr key={scale.deviceId}>
                    <td className="pl-6">
                      <p className="font-bold text-gray-900">{scale.apelido || scale.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{scale.deviceId}</p>
                      {scale.firmware && <p className="text-[11px] text-gray-400">firmware {scale.firmware}</p>}
                    </td>
                    <td>{scale.emailProdutor ? <span className="text-sm text-gray-700 break-all">{scale.emailProdutor}</span> : <Badge variant="info">Livre</Badge>}</td>
                    <td><Signal scale={scale} /></td>
                    <td><LastWeight scale={scale} /></td>
                    <td className="pr-6"><ScaleActions scale={scale} onRelease={release} onRemove={remove} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="lg:hidden divide-y divide-gray-100">
            {scales.map((scale) => (
              <li key={scale.deviceId} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{scale.apelido || scale.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{scale.deviceId}</p>
                  </div>
                  <Signal scale={scale} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Produtor</span>
                  {scale.emailProdutor ? <span className="text-gray-700 truncate">{scale.emailProdutor}</span> : <Badge variant="info">Livre</Badge>}
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Último peso</span>
                  <LastWeight scale={scale} />
                </div>
                <ScaleActions scale={scale} onRelease={release} onRemove={remove} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {dialog}
    </div>
  );
}

function Signal({ scale }: { scale: AdminScale }) {
  if (scale.online) return <Badge variant="success" dot>Com sinal</Badge>;
  return (
    <span className="inline-flex flex-col items-start">
      <Badge variant="neutral" dot>Sem sinal</Badge>
      <span className="text-[11px] text-gray-400 mt-0.5">{scale.ultimoContato ? `visto ${timeAgo(scale.ultimoContato)}` : "nunca conectou"}</span>
    </span>
  );
}

function LastWeight({ scale }: { scale: AdminScale }) {
  if (scale.ultimoKg === null || !scale.emailProdutor) return <span className="text-sm text-gray-400">—</span>;
  return <span className="text-sm font-bold text-gray-800 tabular-nums">{scale.ultimoKg.toLocaleString("pt-BR", { minimumFractionDigits: 3 })} kg</span>;
}

function ScaleActions({ scale, onRelease, onRemove }: { scale: AdminScale; onRelease: (s: AdminScale) => void; onRemove: (s: AdminScale) => void }) {
  const name = scale.apelido || scale.nome;
  const base = "px-3 h-10 flex items-center gap-1 text-xs font-bold rounded-lg border transition";
  return (
    <div className="flex flex-wrap justify-end items-center gap-2">
      {scale.emailProdutor && (
        <button type="button" onClick={() => onRelease(scale)} aria-label={`Liberar ${name}`} className={`${base} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}>
          <Unlink size={14} aria-hidden="true" /> Liberar
        </button>
      )}
      <button type="button" onClick={() => onRemove(scale)} aria-label={`Excluir ${name}`} className={`${base} bg-red-50 text-red-500 border-red-200 hover:bg-red-100`}>
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
