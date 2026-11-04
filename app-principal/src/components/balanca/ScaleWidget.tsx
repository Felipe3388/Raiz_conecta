"use client";

import Link from "next/link";
import { ChevronRight, Scale, WifiOff } from "lucide-react";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { useLiveWeight } from "@/hooks/useLiveWeight";
import { formatKg } from "@/lib/iot/liveWeight";
import { scaleDisplayName } from "@/lib/iot/label";

// A balança no Início: o peso ao vivo da conectada, ou o convite para conectar uma. Leva à tela Minha balança.
export function ScaleWidget() {
  const { scales } = useProdutor();
  const weight = useLiveWeight(scales.active?.deviceId ?? null);
  const online = weight.status === "online";

  if (!scales.state) return <div className="h-full min-h-36 rounded-2xl bg-white border border-gray-200 animate-pulse" aria-hidden="true" />;

  if (!scales.active) {
    return (
      <Link href="/produtor/balancas" className="group h-full rounded-2xl border border-dashed border-gray-300 bg-white p-5 flex flex-col justify-between gap-4 hover:border-green-600 transition-colors">
        <Scale size={24} className="text-gray-500" aria-hidden="true" />
        <div>
          <p className="font-bold text-gray-900">Conecte sua balança</p>
          <p className="text-sm text-gray-600 mt-1">Pese os pedidos sem digitar. Basta o código da etiqueta.</p>
        </div>
        <span className="text-sm font-bold text-green-700 flex items-center gap-1">Conectar <ChevronRight size={16} aria-hidden="true" /></span>
      </Link>
    );
  }

  return (
    <Link href="/produtor/balancas" className="group h-full rounded-2xl bg-mata text-white p-5 flex flex-col justify-between gap-3 hover:bg-green-900 transition-colors" aria-label={`Minha balança: ${scaleDisplayName(scales.active)}`}>
      <div className="flex items-center justify-between gap-2 text-sm text-green-100">
        <span className="flex items-center gap-2 min-w-0"><Scale size={17} aria-hidden="true" /><span className="truncate">{scaleDisplayName(scales.active)}</span></span>
        <span className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
          {online ? <span className="w-2 h-2 rounded-full bg-milho" aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}
          {weight.status === "connecting" ? "conectando" : online ? "ao vivo" : "sem sinal"}
        </span>
      </div>
      <p className={`font-display text-4xl font-extrabold tabular-nums tracking-tight ${online ? "text-milho" : "text-green-200/50"}`} aria-live="polite">
        {online && weight.kg !== null ? formatKg(weight.kg) : "— kg"}
      </p>
      <p className="text-xs text-green-100">{online ? (weight.stable ? "Peso parado" : "Peso oscilando") : "Ligue a balança e confira o Wi-Fi"}</p>
    </Link>
  );
}
