"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Wifi, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MAX_SCALE_NAME_LENGTH } from "@/lib/iot/name";
import { scaleDisplayName, type ScaleLink } from "@/lib/iot/label";

interface ScaleCardProps {
  scale: ScaleLink;
  active: boolean;
  busy: boolean;
  onActivate: () => void;
  onRename: (name: string) => Promise<boolean>;
  onRemove: () => void;
}

// Uma balança do produtor (como o ScaleCard do app): a conectada fica destacada; as outras têm "Usar esta".
export function ScaleCard({ scale, active, busy, onActivate, onRename, onRemove }: ScaleCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const displayName = scaleDisplayName(scale);

  return (
    <li className={`rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${active ? "bg-green-50" : "bg-white hover:bg-gray-50"}`}>
      <div className={`w-12 h-12 shrink-0 rounded-xl grid place-items-center ${active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
        <Wifi size={22} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-900 truncate flex items-center gap-2">
          {displayName}
          {active && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full px-2 py-0.5"><CheckCircle2 size={12} aria-hidden="true" /> Selecionada</span>}
        </p>
        <p className="text-xs text-gray-500 font-mono">{scale.deviceId}{scale.nickname ? ` · ${scale.deviceName}` : ""}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {!active && <Button size="sm" onClick={onActivate} disabled={busy}>Usar esta</Button>}
        <Button size="sm" variant="ghost" onClick={() => { setName(scale.nickname ?? ""); setRenaming(true); }} aria-label={`Renomear ${displayName}`}>
          <Pencil size={15} aria-hidden="true" /> Nome
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove} disabled={busy} className="text-red-600 hover:bg-red-50" aria-label={`Remover ${displayName}`}>
          <Trash2 size={15} aria-hidden="true" /> Remover
        </Button>
      </div>

      <Modal isOpen={renaming} onClose={() => setRenaming(false)} title="Nome da balança">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await onRename(name)) setRenaming(false);
          }}
        >
          <Input
            label="Como você chama esta balança"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_SCALE_NAME_LENGTH}
            placeholder={scale.deviceName}
            hint={`Até ${MAX_SCALE_NAME_LENGTH} letras. Vazio volta para "${scale.deviceName}".`}
            data-autofocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenaming(false)}>Cancelar</Button>
            <Button type="submit" isLoading={busy}>Salvar nome</Button>
          </div>
        </form>
      </Modal>
    </li>
  );
}
