"use client";

import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { useDialog } from "@/hooks/useDialog";

const TONES = {
  green: { header: "from-green-50 to-emerald-50", icon: "bg-green-100 text-green-700", button: "bg-green-600 hover:bg-green-700" },
  blue: { header: "from-blue-50 to-indigo-50", icon: "bg-blue-100 text-blue-700", button: "bg-blue-600 hover:bg-blue-700" },
} as const;

export interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  closeLabel?: string;
  children: ReactNode;
}

// Janela de leitura de um documento longo (Termos, Privacidade...): título fixo, texto rolando e um botão no fim.
// Usa o mesmo comportamento das outras janelas (Esc fecha, foco preso dentro, a página de trás não rola).
export function DocumentModal({ isOpen, onClose, title, subtitle, icon: Icon, tone = "green", closeLabel = "Entendi", children }: DocumentModalProps) {
  const titleId = useId();
  const ref = useDialog<HTMLDivElement>(isOpen, onClose);
  const look = TONES[tone];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden outline-none"
          >
            <div className={`flex items-center justify-between gap-3 px-5 sm:px-7 py-5 border-b border-gray-200 bg-gradient-to-r ${look.header} shrink-0`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-xl ${look.icon}`}><Icon size={20} aria-hidden="true" /></div>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-lg font-black text-gray-900">{title}</h2>
                  <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div data-dialog-body className="overflow-y-auto flex-1 px-5 sm:px-7 py-6 space-y-6 text-sm text-gray-700 leading-relaxed">{children}</div>

            <div className="px-5 sm:px-7 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button type="button" onClick={onClose} className={`w-full h-11 text-white font-bold rounded-xl transition-colors text-sm ${look.button}`}>
                {closeLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
