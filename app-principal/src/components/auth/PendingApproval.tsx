"use client";

import { AccountReview } from "./AccountReview";

// Tentou entrar com a conta ainda em análise (dentro do cartão do login).
export function PendingApproval({ onBack }: { onBack: () => void }) {
  return (
    <AccountReview kind="analise" title="Conta em Análise" onBack={onBack}>
      <p>
        Recebemos seus dados! Estamos conferindo seu documento. Fique de olho no seu{" "}
        <strong className="text-gray-900">e-mail</strong>: avisaremos assim que seu acesso for liberado.
      </p>
    </AccountReview>
  );
}
