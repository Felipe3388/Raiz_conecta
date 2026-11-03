"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, Radio, WifiOff } from "lucide-react";
import { useLiveWeight } from "@/hooks/useLiveWeight";
import { formatKg } from "@/lib/iot/liveWeight";
import { timeAgo } from "@/lib/format/time";

// O peso que a balança conectada está mostrando agora, lido do servidor (o módulo ESP32 manda as leituras para lá).
// Só leitura: registrar a pesagem de um pedido continua no app, que guia produto por produto.
export function LiveWeightPanel({ deviceId, name }: { deviceId: string; name: string }) {
  const weight = useLiveWeight(deviceId);
  const reduced = useReducedMotion();
  const online = weight.status === "online";
  // "há 3 s" pelo relógio do servidor (o do computador da pessoa pode estar adiantado ou atrasado).
  const measured = weight.measuredAt && weight.serverNow ? timeAgo(weight.measuredAt, new Date(weight.serverNow)) : null;

  return (
    <section aria-labelledby="peso-ao-vivo" className={`rounded-2xl border p-6 md:p-8 transition-colors ${online ? "bg-green-50 border-green-200" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="peso-ao-vivo" className="flex items-center gap-2 text-base">
          <Radio size={19} className={online ? "text-green-700" : "text-gray-400"} aria-hidden="true" /> Peso ao vivo · {name}
        </h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
          {weight.status === "connecting" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : online ? <span className="w-2 h-2 rounded-full bg-green-500" /> : <WifiOff size={13} aria-hidden="true" />}
          {weight.status === "connecting" ? "Conectando…" : online ? "Com sinal" : "Sem sinal"}
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center text-center gap-2" aria-live="polite" aria-atomic="true">
        {online && weight.kg !== null ? (
          <>
            <motion.p
              key={weight.stable ? "estavel" : "oscilando"}
              initial={reduced ? false : { scale: 0.96, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl md:text-7xl font-black tabular-nums text-gray-900"
            >
              {formatKg(weight.kg)}
            </motion.p>
            <p className={`flex items-center gap-1.5 text-sm font-bold ${weight.stable ? "text-green-700" : "text-amber-700"}`}>
              {weight.stable ? <><CheckCircle2 size={16} aria-hidden="true" /> Peso parado</> : "Peso oscilando: espere assentar"}
            </p>
          </>
        ) : (
          <>
            <p className="text-6xl md:text-7xl font-black tabular-nums text-gray-300">— kg</p>
            <p className="text-sm text-gray-500 max-w-sm">
              {weight.status === "connecting" ? "Buscando a leitura da balança…" : "A balança não manda sinal há mais de 15 segundos. Confira se ela está ligada e no Wi-Fi."}
            </p>
          </>
        )}
        {measured && <p className="text-xs text-gray-500">Última leitura {measured}</p>}
      </div>
    </section>
  );
}
