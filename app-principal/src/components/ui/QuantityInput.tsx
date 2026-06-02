"use client";
import { Plus, Minus } from "lucide-react";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityInput({ value, onChange, min = 0, max = Infinity, className = "" }: QuantityInputProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={`rc-qty-input ${className}`}>
      <button type="button" onClick={dec} className="rc-qty-btn" aria-label="Diminuir">
        <Minus size={15} />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-full text-center font-black text-lg bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onClick={inc} className="rc-qty-btn" aria-label="Aumentar">
        <Plus size={15} />
      </button>
    </div>
  );
}
