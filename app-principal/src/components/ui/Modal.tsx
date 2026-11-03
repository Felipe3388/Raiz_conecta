"use client";

import { useId } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDialog } from "@/hooks/useDialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // md (padrão) para confirmações e formulários curtos; lg para formulários com mais campos.
  size?: "md" | "lg";
}

const SIZES = { md: "max-w-md", lg: "max-w-xl" } as const;

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const titleId = useId();
  const ref = useDialog<HTMLDivElement>(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fundo escuro que apaga suavemente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Janela do Modal com efeito de Mola */}
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className={`bg-white rounded-2xl shadow-2xl w-full ${SIZES[size]} p-6 relative z-10 max-h-[90vh] overflow-y-auto outline-none`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id={titleId} className="text-xl font-bold text-gray-800">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-10 w-10 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors -mr-2"
              >
                <X size={22} />
              </button>
            </div>
            <div data-dialog-body>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
