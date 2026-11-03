"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { parseQuantity, stepQuantity } from "@/lib/format/quantity";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  // Nome do item, para os botões e o campo serem lidos como "Aumentar Tomate", "Quantidade de Tomate".
  itemName?: string;
  // Unidade mostrada ao lado do número (Kg, Caixa...).
  unit?: string;
  onEnter?: () => void;
  className?: string;
}

// O campo de quantidade do site: − e + mudam na hora; digitando, dá para apagar e escrever à vontade e o número só
// vale ao sair do campo ou apertar Enter (sem pular para o mínimo no meio da digitação).
export function QuantityInput({ value, onChange, min = 0, max = Infinity, itemName, unit, onEnter, className = "" }: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const of = itemName ? ` de ${itemName}` : "";

  function commit() {
    if (draft === null) return;
    const parsed = parseQuantity(draft, min, max);
    setDraft(null);
    if (parsed !== null && parsed !== value) onChange(parsed);
  }

  return (
    <div className={`rc-qty-input focus-within:ring-2 focus-within:ring-green-500 ${className}`}>
      <button type="button" onClick={() => onChange(stepQuantity(value, -1, min, max))} disabled={value <= min} className="rc-qty-btn disabled:opacity-40" aria-label={`Diminuir a quantidade${of}`}>
        <Minus size={15} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Quantidade${of}${unit ? ` em ${unit}` : ""}`}
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          commit();
          onEnter?.();
        }}
        className="w-full min-w-0 text-center font-black text-lg text-green-800 bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && <span className="text-[10px] text-gray-400 font-bold uppercase mr-1 shrink-0" aria-hidden="true">{unit}</span>}
      <button type="button" onClick={() => onChange(stepQuantity(value, 1, min, max))} disabled={value >= max} className="rc-qty-btn disabled:opacity-40" aria-label={`Aumentar a quantidade${of}`}>
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
