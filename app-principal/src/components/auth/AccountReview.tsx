"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Clock, MailCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AccountReviewProps {
  // "enviado": acabou de criar a conta (envelope). "analise": tentou entrar e a conta ainda está em análise (relógio).
  kind: "enviado" | "analise";
  title: string;
  children: ReactNode;
  // Para onde o botão leva: um link (página) ou uma ação (trocar de aba no login).
  backHref?: string;
  onBack?: () => void;
}

// A mensagem de "conta em análise", com a mesma sequência do app: o ícone "estoura" com uma mola,
// depois o texto e o botão aparecem. Sem animação para quem pediu menos movimento.
export function AccountReview({ kind, title, children, backHref, onBack }: AccountReviewProps) {
  const reduced = useReducedMotion();
  const Icon = kind === "enviado" ? MailCheck : Clock;
  const reveal = (delay: number) =>
    reduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45 } };
  const buttonClass = "w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-green-600 text-green-700 font-bold hover:bg-green-50 transition-colors";

  return (
    <div className="text-center space-y-6 py-4">
      <motion.div
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.5, stiffness: 220, damping: 11 }}
        className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${kind === "enviado" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-500"}`}
      >
        <Icon size={48} aria-hidden="true" />
      </motion.div>

      <motion.div {...reveal(0.7)} className="space-y-3">
        <h1 className="!text-3xl">{title}</h1>
        <div className="text-gray-600 leading-relaxed px-2 text-sm space-y-2">{children}</div>
      </motion.div>

      <motion.div {...reveal(0.9)}>
        {backHref ? (
          <Link href={backHref} className={buttonClass}><ArrowLeft size={18} aria-hidden="true" /> Voltar para o Login</Link>
        ) : (
          <button type="button" onClick={onBack} className={buttonClass}><ArrowLeft size={18} aria-hidden="true" /> Voltar para o Login</button>
        )}
      </motion.div>
    </div>
  );
}
