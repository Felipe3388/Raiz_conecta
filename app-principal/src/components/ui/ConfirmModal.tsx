"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, CheckCircle2, Info, X, LucideIcon } from "lucide-react";
import { Button } from "./Button";

type ConfirmVariant = "danger" | "warning" | "success" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmVariant, {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
  accentColor: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    accentColor: "border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmClass: "bg-amber-500 hover:bg-amber-600 text-white",
    accentColor: "border-amber-200",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    confirmClass: "bg-green-600 hover:bg-green-700 text-white",
    accentColor: "border-green-200",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmClass: "bg-blue-600 hover:bg-blue-700 text-white",
    accentColor: "border-blue-200",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "warning",
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Botão fechar */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            {/* Conteúdo */}
            <div className="p-8 text-center space-y-4">
              {/* Ícone */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, duration: 0.5, bounce: 0.5 }}
                className={`mx-auto w-16 h-16 ${config.iconBg} ${config.iconColor} rounded-2xl flex items-center justify-center`}
              >
                <Icon size={32} />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </div>

            {/* Botões */}
            <div className={`px-8 pb-8 flex gap-3`}>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${config.confirmClass}`}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
