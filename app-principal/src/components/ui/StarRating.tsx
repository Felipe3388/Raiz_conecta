"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  // Sem `onChange` a nota só é exibida.
  onChange?: (value: number) => void;
  label?: string;
  size?: number;
}

// Nota de 1 a 5 estrelas. Editável: grupo de opções que o teclado percorre com as setas e o leitor de tela anuncia.
export function StarRating({ value, onChange, label = "Nota", size = 24 }: StarRatingProps) {
  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" role="img" aria-label={`${label}: ${value} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size} fill={star <= value ? "currentColor" : "none"} className={star <= value ? "text-amber-400" : "text-gray-300"} aria-hidden="true" />
        ))}
      </span>
    );
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    onChange?.(Math.min(5, Math.max(1, value + step)));
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
          tabIndex={star === value ? 0 : -1}
          onClick={() => onChange(star)}
          className="grid h-10 w-10 place-items-center rounded-lg hover:scale-110 transition-transform"
        >
          <Star size={size} fill={star <= value ? "currentColor" : "none"} className={star <= value ? "text-amber-400" : "text-gray-300"} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
