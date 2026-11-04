"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { labelError, maskDeviceId, maskPairingCode, parseLabelText } from "@/lib/iot/label";

// Adicionar uma balança pelos dados da etiqueta (o servidor não enxerga as balanças perto de quem está no site).
// Colar o texto do QR Code ("RC:...") no primeiro campo preenche os dois.
export function AddScaleForm({ busy, onAdd, onCancel }: { busy: boolean; onAdd: (deviceId: string, code: string) => Promise<boolean>; onCancel?: () => void }) {
  const [deviceId, setDeviceId] = useState("");
  const [code, setCode] = useState("");

  function onDeviceChange(text: string) {
    const fromQr = parseLabelText(text);
    if (fromQr) {
      setDeviceId(fromQr.deviceId);
      setCode(fromQr.code);
      return;
    }
    setDeviceId(maskDeviceId(text));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = labelError(deviceId, code);
    if (problem) return void toast.warning(problem);
    if (await onAdd(deviceId, code)) {
      setDeviceId("");
      setCode("");
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-4" noValidate>
      <div>
        <h2 className="flex items-center gap-2 text-base"><Tag size={19} className="text-green-700" aria-hidden="true" /> Dados da etiqueta</h2>
        <p className="text-sm text-gray-500 mt-1">Estão na etiqueta colada na balança. Se tiver o QR Code, cole o texto dele no primeiro campo.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Endereço da balança" name="deviceId" value={deviceId} onChange={(e) => onDeviceChange(e.target.value)} placeholder="A4:CF:12:9B:07:E1" autoComplete="off" spellCheck={false} className="font-mono" />
        <Input label="Código da etiqueta" name="codigo" value={code} onChange={(e) => setCode(maskPairingCode(e.target.value))} placeholder="K7M2-Q9XT" autoComplete="off" spellCheck={false} className="font-mono" />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" isLoading={busy}><Plus size={17} aria-hidden="true" /> Adicionar e conectar</Button>
      </div>
    </form>
  );
}
