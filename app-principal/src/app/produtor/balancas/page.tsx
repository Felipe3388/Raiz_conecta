"use client";

import { useState } from "react";
import { AlertTriangle, Plus, RefreshCw, Wifi, Info, CheckCircle2 } from "lucide-react";
import { AddScaleForm } from "@/components/balanca/AddScaleForm";
import { LiveWeightPanel } from "@/components/balanca/LiveWeightPanel";
import { ScaleCard } from "@/components/balanca/ScaleCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageLoader } from "@/components/ui/PageLoader";
import { useConfirm } from "@/components/ui/useConfirm";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { isActiveScale, scaleDisplayName } from "@/lib/iot/label";

// Lists saved API-linked scales in a network-settings style. Local Wi-Fi discovery is not promised by the server.
export default function BalancasPage() {
  const { scales } = useProdutor();
  const { confirm, dialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const { state, active } = scales;

  if (!state) {
    return scales.error ? (
      <EmptyState icon={<AlertTriangle size={56} className="text-red-300" aria-hidden="true" />} title="Não foi possível abrir suas balanças" description={scales.error} actionLabel="Tentar de novo" onAction={() => void scales.reload()} />
    ) : <PageLoader message="Carregando suas balanças..." />;
  }

  const sortedScales = [...state.scales].sort((a, b) => Number(isActiveScale(state, b)) - Number(isActiveScale(state, a)));
  const showForm = adding || state.scales.length === 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {dialog}
      <PageHeading title="Conexão com a balança" subtitle="Gerencie os dispositivos vinculados à sua conta, como na lista de redes salvas." />

      <section className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden" aria-label="Gerenciador de balanças">
        <div className="p-5 bg-green-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 grid place-items-center"><Wifi size={25} aria-hidden="true" /></div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black">Balanças</h2>
              <p className="text-green-100 text-sm truncate">{active ? `Selecionada: ${scaleDisplayName(active)}` : "Nenhuma balança selecionada"}</p>
            </div>
          </div>
          <button type="button" aria-label="Atualizar lista de balanças" title="Atualizar lista" onClick={() => void scales.reload()}
            className="h-11 w-11 grid place-items-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <RefreshCw size={21} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm uppercase tracking-wider font-bold text-gray-500">Dispositivos salvos</h3>
          <span className="text-sm text-gray-500">{state.scales.length} {state.scales.length === 1 ? "balança" : "balanças"}</span>
        </div>
        {sortedScales.length > 0 ? (
          <ul className="px-3 pb-3 divide-y divide-gray-100">
            {sortedScales.map((scale) => (
              <ScaleCard key={scale.deviceId} scale={scale} active={isActiveScale(state, scale)} busy={scales.busy}
                onActivate={() => void scales.activate(scale)} onRename={(name) => scales.rename(scale, name)}
                onRemove={() => confirm({ title: "Remover a balança?", description: `"${scaleDisplayName(scale)}" sai da sua conta e o histórico dela é apagado. Para usar de novo, será preciso o código da etiqueta.`, confirmLabel: "Remover", variant: "danger", run: async () => void (await scales.remove(scale)) })} />
            ))}
          </ul>
        ) : <p className="p-6 pt-3 text-gray-600">Você ainda não vinculou nenhuma balança.</p>}

        <div className="border-t border-gray-100 px-5 py-4">
          <h3 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-3">Adicionar dispositivo</h3>
          {showForm ? (
            <AddScaleForm busy={scales.busy} onCancel={state.scales.length > 0 ? () => setAdding(false) : undefined}
              onAdd={async (deviceId, code) => { const ok = await scales.add(deviceId, code); if (ok) setAdding(false); return ok; }} />
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Adicionar via etiqueta</Button>
          )}
        </div>
      </section>

      <div className="flex gap-3 p-4 rounded-2xl bg-green-50 text-green-900 text-sm leading-relaxed">
        <Info size={21} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p>A lista mostra os dispositivos vinculados, não redes Wi-Fi próximas. Para cadastrar outra balança, use o endereço e o código da etiqueta; a API valida o vínculo com sua conta.</p>
      </div>
      {active && <div className="space-y-3"><p className="flex items-center gap-2 font-bold text-green-900"><CheckCircle2 size={19} /> Balança selecionada</p><LiveWeightPanel deviceId={active.deviceId} name={scaleDisplayName(active)} /></div>}
    </div>
  );
}
