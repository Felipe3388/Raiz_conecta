"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

// Copia um texto (código da etiqueta, segredo da balança) e mostra um "copiado" por um instante.
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie à mão.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300 transition"
    >
      {copied ? <Check size={15} className="text-green-600" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  );
}
