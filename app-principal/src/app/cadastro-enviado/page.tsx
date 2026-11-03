"use client";

import { useSyncExternalStore } from "react";
import { AccountReview } from "@/components/auth/AccountReview";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FloatingLeaves } from "@/components/brand/FloatingLeaves";
import { readSignupSent, subscribeSignupDraft } from "@/lib/auth/signupDraft";

// Depois do "Concluir cadastro": a mesma tela do app (logo que cresce, folhinhas caindo, envelope que estoura e o
// aviso para olhar o e-mail). Abrir o endereço direto também funciona: só não mostra o e-mail usado.
export default function CadastroEnviadoPage() {
  const sent = useSyncExternalStore(subscribeSignupDraft, readSignupSent, () => null);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-linear-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 overflow-hidden">
      <FloatingLeaves />
      <div className="relative w-full max-w-lg flex flex-col items-center gap-6">
        <BrandLogo />
        <div className="w-full bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">
          <AccountReview kind="enviado" title={sent?.primeiroNome ? `Tudo certo, ${sent.primeiroNome}!` : "Cadastro enviado!"} backHref="/login">
            <p>
              Recebemos seus dados e seu documento. Agora a nossa equipe confere tudo e você recebe a resposta no{" "}
              <strong className="text-gray-900">e-mail</strong>
              {sent?.email ? <> <strong className="text-gray-900 break-all">{sent.email}</strong></> : null}.
            </p>
            <p>Fique de olho também na caixa de spam. Assim que a conta for aprovada, é só entrar.</p>
          </AccountReview>
        </div>
      </div>
    </div>
  );
}
