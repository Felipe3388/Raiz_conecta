"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ConfirmModal } from "./ConfirmModal";

export interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "success" | "info";
  // O que fazer ao confirmar. O botão fica ocupado até terminar; depois a janela fecha.
  run: () => Promise<void> | void;
}

// Pergunta "tem certeza?" antes de uma ação. Uso: `const { confirm, dialog } = useConfirm();` e `{dialog}` na tela.
export function useConfirm(): { confirm: (request: ConfirmRequest) => void; dialog: ReactNode } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);

  const dialog = (
    <ConfirmModal
      isOpen={request !== null}
      onClose={() => setRequest(null)}
      onConfirm={async () => {
        if (!request) return;
        setBusy(true);
        try {
          await request.run();
        } finally {
          setBusy(false);
          setRequest(null);
        }
      }}
      title={request?.title ?? ""}
      description={request?.description ?? ""}
      confirmLabel={request?.confirmLabel}
      variant={request?.variant}
      isLoading={busy}
    />
  );

  return { confirm, dialog };
}
