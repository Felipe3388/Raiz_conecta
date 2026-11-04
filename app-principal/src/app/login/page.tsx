"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LogIn, Scale, Sprout, Store, UserPlus } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
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

const SIDE_POINTS = [
  { icon: Store, text: "Mercados montam a cotação e recebem ofertas de vários produtores." },
  { icon: Sprout, text: "Produtores atendem a parte que têm e acompanham tudo pelo app." },
  { icon: Scale, text: "A balança conectada confere o peso antes de o pedido sair." },
];

const TABS = [
  { id: "login", label: "Entrar", icon: LogIn },
  { id: "cadastro", label: "Criar conta", icon: UserPlus },
] as const;

// Entrar e criar conta: as mesmas telas do app (login, cadastro e conta em análise), em uma página só.
// Cada parte mora em src/components/auth e as regras de validação em src/lib/validation/auth.
function LoginContent() {
  const params = useSearchParams();
  const [view, setView] = useState<View>(params.get("modo") === "cadastro" ? "cadastro" : "login");
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const initialType = params.get("tipo") === "mercado" ? "mercado" : "produtor";

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Painel da marca (só no computador): o que a pessoa ganha ao entrar, com um exemplo de pedido. */}
      <aside className="hidden lg:flex flex-col justify-between gap-10 bg-mata text-white p-12 xl:p-16">
        <div className="max-w-md">
          <p className="rc-display-2 !text-white">O mercado pede. O produtor da região entrega.</p>
          <ul className="mt-8 space-y-4 text-green-100">
            {SIDE_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <Icon size={20} className="text-milho shrink-0 mt-0.5" aria-hidden="true" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-green-200/80">Todo cadastro passa pela conferência da equipe antes de liberar o acesso.</p>
      </aside>

      <div className="flex flex-col items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-110">
          <p className="text-gray-600 mb-5 lg:hidden" aria-live="polite">{SUBTITLES[view]}</p>

          {view !== "em_analise" && (
            <div role="tablist" aria-label="Entrar ou criar conta" className="p-1 bg-gray-200/70 rounded-xl flex gap-1 mb-8">
              {TABS.map((tab) => {
                const active = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(tab.id)}
                    className={`flex-1 relative h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${active ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {active && <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-white rounded-lg shadow-sm" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />}
                    <tab.icon size={16} className="relative z-10" aria-hidden="true" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: view === "cadastro" ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: view === "cadastro" ? -16 : 16 }}
              transition={{ duration: 0.2 }}
            >
              {view === "login" && <LoginForm onPending={() => setView("em_analise")} />}
              {view === "cadastro" && <SignupForm initialType={initialType} onOpenTerms={() => setTermsOpen(true)} onOpenPrivacy={() => setPrivacyOpen(true)} />}
              {view === "em_analise" && <PendingApproval onBack={() => setView("login")} />}
            </motion.div>
          </AnimatePresence>

          {view !== "em_analise" && (
            <p className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600">
              Precisa de ajuda?{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green-700 font-bold hover:underline underline-offset-4">Fale com o suporte</a>.
              {" "}Ao entrar, você concorda com os{" "}
              <button type="button" onClick={() => setTermsOpen(true)} className="text-green-700 font-bold hover:underline underline-offset-4">termos de uso</button>.
            </p>
          )}
        </div>
      </div>

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
