"use client";

import { useEffect, useId, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { IMAGE_TYPES, checkFile } from "@/lib/media/rules";

interface PhotoFieldProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  // Foto que já existe (ao editar). Aparece até a pessoa escolher outra.
  currentUrl?: string | null;
  hint?: string;
}

// Escolher uma foto: mostra a prévia e avisa na hora se o arquivo é grande demais ou não é imagem.
export function PhotoField({ label, file, onChange, currentUrl, hint }: PhotoFieldProps) {
  const id = useId();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen) {
      const problem = checkFile(chosen, IMAGE_TYPES);
      if (problem) {
        toast.warning(problem);
        event.target.value = "";
        return;
      }
    }
    onChange(chosen);
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), o Image do Next não otimiza esse tipo de endereço
          <img src={previewUrl} alt="Prévia da foto escolhida" className="w-16 h-16 shrink-0 rounded-full object-cover border-2 border-green-300 shadow-sm" />
        ) : currentUrl ? (
          <Image src={currentUrl} alt="Foto atual" width={64} height={64} className="w-16 h-16 shrink-0 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
        ) : (
          <div className="w-16 h-16 shrink-0 rounded-full bg-gray-100 grid place-items-center text-gray-400 text-xs font-bold border-2 border-gray-200">Sem foto</div>
        )}
        <div className="flex-1 min-w-0">
          <input
            id={id}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            onChange={pick}
            className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">{hint ?? "JPG, PNG ou WebP, até 5 MB."}</p>
        </div>
      </div>
    </div>
  );
}
