"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Wordmark } from "@/components/brand/Wordmark";
import { PendingApproval } from "@/components/auth/PendingApproval";
import { SignupForm } from "@/components/auth/SignupForm";
import { PrivacidadeModal, TermosModal } from "@/components/legal/LegalModals";
import { SUPPORT_EMAIL } from "@/lib/support";

type View = "login" | "cadastro" | "em_analise";

const SUBTITLES: Record<View, string> = {
  login: "Acesse sua conta para continuar",
  cadastro: "Crie sua conta para começar",
  em_analise: "Aguardando aprovação",
};

const TABS = [
  { id: "login", label: "Entrar", icon: LogIn },
  { id: "cadastro", label: "Criar Conta", icon: UserPlus },
] as const;

// Entrar e criar conta: as mesmas telas do app (login, cadastro e conta em análise), em uma página só.
// Cada parte mora em src/components/auth e as regras de validação em src/lib/validation/auth.
function LoginContent() {
  const params = useSearchParams();
  const [view, setView] = useState<View>(params.get("modo") === "cadastro" ? "cadastro" : "login");
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-8">
        <Wordmark href="/" size="lg" />
        <p className="text-gray-600 mt-3 text-sm" aria-live="polite">{SUBTITLES[view]}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }} className="w-full max-w-120">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {view !== "em_analise" && (
            <div role="tablist" className="p-1.5 bg-gray-100/80 rounded-full flex gap-1 relative m-6 mb-0 border border-gray-200">
              {TABS.map((tab) => {
                const active = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(tab.id)}
                    className={`flex-1 relative z-10 px-4 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${
                      active ? "text-green-700" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {active && (
                      <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-white rounded-full shadow-md" transition={{ type: "spring", duration: 0.5, bounce: 0.2 }} />
                    )}
                    <tab.icon size={16} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-8 md:p-10 relative min-h-100 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: view === "cadastro" ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === "cadastro" ? -24 : 24 }}
                transition={{ duration: 0.25 }}
              >
                {view === "login" && <LoginForm onPending={() => setView("em_analise")} />}
                {view === "cadastro" && <SignupForm onOpenTerms={() => setTermsOpen(true)} onOpenPrivacy={() => setPrivacyOpen(true)} />}
                {view === "em_analise" && <PendingApproval onBack={() => setView("login")} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {view !== "em_analise" && (
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-600">
              Precisa de ajuda?{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green-700 font-bold hover:underline">
                Fale com o suporte.
              </a>
            </div>
          )}
        </div>
      </motion.div>

      <p className="text-center text-xs text-gray-500 mt-6">
        Ao acessar, você concorda com nossos{" "}
        <button type="button" onClick={() => setTermsOpen(true)} className="text-green-700 font-bold hover:underline">
          termos de uso
        </button>
        .
      </p>

      <TermosModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacidadeModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
