"use client";

import { AlertTriangle, Scale, Smartphone } from "lucide-react";
import { LiveWeightPanel } from "@/components/balanca/LiveWeightPanel";
import { ScaleCard } from "@/components/balanca/ScaleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageLoader } from "@/components/ui/PageLoader";
import { useConfirm } from "@/components/ui/useConfirm";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { isActiveScale, scaleDisplayName } from "@/lib/iot/label";

// Minha balança: as balanças do produtor e o peso ao vivo da conectada (a tela Balanças do app, na versão web).
export default function BalancasPage() {
  const { scales } = useProdutor();
  const { confirm, dialog } = useConfirm();
  const { state, active } = scales;

  if (!state) {
    return scales.error ? (
      <EmptyState icon={<AlertTriangle size={56} className="text-red-300" aria-hidden="true" />} title="Não foi possível abrir suas balanças" description={scales.error} actionLabel="Tentar de novo" onAction={() => void scales.reload()} />
    ) : (
      <PageLoader message="Carregando suas balanças..." />
    );
  }

  const hasScales = state.scales.length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {dialog}
      <PageHeading
        title="Minha balança"
        subtitle="A balança conectada é a que pesa os pedidos no app."
      />

      <div className="rc-banner rc-banner-green">
        {hasScales ? <Smartphone size={24} aria-hidden="true" className="shrink-0" /> : <Scale size={28} aria-hidden="true" className="shrink-0" />}
        <div>
          <p className="font-black">{hasScales ? "Quer adicionar outra balança?" : "Conecte sua balança"}</p>
          <p className="text-sm">
            A balança é adicionada pelo app Raiz Conecta, no celular: <strong>Mais → Balança → Adicionar balança</strong>. O app liga o celular à rede da balança
            (Balanca_raiz_XXXX) e envia a ela o Wi-Fi do seu galpão. Depois disso ela aparece aqui sozinha.
          </p>
        </div>
      </div>

      {active && <LiveWeightPanel deviceId={active.deviceId} name={scaleDisplayName(active)} />}

      {hasScales && (
        <section aria-labelledby="minhas-balancas" className="space-y-3">
          <h2 id="minhas-balancas" className="text-base">Minhas balanças</h2>
          {!active && <p className="text-sm text-amber-700 font-bold">Nenhuma balança conectada. Escolha uma em &quot;Usar esta&quot;.</p>}
          <ul className="space-y-3">
            {state.scales.map((scale) => (
              <ScaleCard
                key={scale.deviceId}
                scale={scale}
                active={isActiveScale(state, scale)}
                busy={scales.busy}
                onActivate={() => void scales.activate(scale)}
                onRename={(name) => scales.rename(scale, name)}
                onRemove={() =>
                  confirm({
                    title: "Remover a balança?",
                    description: `"${scaleDisplayName(scale)}" sai da sua conta e o histórico dela é apagado. Para usar de novo, será preciso adicioná-la outra vez pelo app.`,
                    confirmLabel: "Remover",
                    variant: "danger",
                    run: async () => void (await scales.remove(scale)),
                  })
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
