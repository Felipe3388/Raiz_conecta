"use client";

import { useId } from "react";
import { toast } from "sonner";
import { CheckCircle, UploadCloud } from "lucide-react";
import { checkFile } from "@/lib/media/rules";

interface FileDropProps {
  file: File | null;
  onChange: (file: File | null) => void;
  // Tipos aceitos (ex.: DOCUMENT_TYPES). Arquivo de outro tipo ou grande demais é recusado na hora, com aviso.
  accept: readonly string[];
  // O que a pessoa vai anexar ("Carteira de Identidade (RG)"): aparece no convite.
  what: string;
  hint?: string;
}

// Área grande para anexar um arquivo (documento do cadastro): mostra o nome do escolhido e permite trocar.
export function FileDrop({ file, onChange, accept, what, hint = "Foto nítida ou PDF, até 5 MB." }: FileDropProps) {
  const id = useId();

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen) {
      const problem = checkFile(chosen, accept);
      if (problem) {
        toast.warning(problem);
        event.target.value = "";
        return;
      }
    }
    onChange(chosen);
  }

  return (
    <label
      htmlFor={id}
      className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer focus-within:outline-2 focus-within:outline-green-600 ${
        file ? "border-green-500 bg-green-50 shadow-inner" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
      }`}
    >
      <input type="file" className="sr-only" id={id} accept={accept.join(",")} onChange={pick} />
      {file ? (
        <span className="flex flex-col items-center text-green-700">
          <CheckCircle className="w-12 h-12 mb-2" aria-hidden="true" />
          <span className="font-bold text-lg break-all">{file.name}</span>
          <span className="text-sm opacity-80">Toque para trocar o arquivo</span>
        </span>
      ) : (
        <span className="flex flex-col items-center text-gray-500">
          <UploadCloud className="w-12 h-12 mb-2 text-gray-400" aria-hidden="true" />
          <span className="font-bold text-gray-700 mb-1 text-lg">Toque para anexar: {what}</span>
          <span className="text-sm font-medium">{hint}</span>
        </span>
      )}
    </label>
  );
}
