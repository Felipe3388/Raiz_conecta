"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ReasonRequest {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "warning" | "danger";
  run: (reason: string) => Promise<void>;
}

// Pede o motivo antes de suspender ou excluir uma conta (o texto vai por e-mail para a pessoa).
export function ReasonModal({ request, onClose }: { request: ReasonRequest | null; onClose: () => void }) {
  return (
    <Modal isOpen={request !== null} onClose={onClose} title={request?.title ?? ""}>
      {request && <ReasonForm key={request.title} request={request} onClose={onClose} />}
    </Modal>
  );
}

function ReasonForm({ request, onClose }: { request: ReasonRequest; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason.trim() || busy) return;
    setBusy(true);
    try {
      await request.run(reason.trim());
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <p className="text-sm text-gray-600">{request.description}</p>
      <div>
        <label htmlFor="motivo" className="text-sm font-semibold text-gray-700 block mb-1.5">
          Motivo <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Descreva o motivo de forma clara..."
          rows={4}
          maxLength={500}
          required
          data-autofocus
          className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
        <Button type="submit" isLoading={busy} disabled={!reason.trim()} className={`flex-1 ${request.variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
          {request.confirmLabel}
        </Button>
      </div>
    </form>
  );
}
