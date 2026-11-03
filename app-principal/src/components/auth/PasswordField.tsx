"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { passwordRequirements, passwordStrength } from "@/lib/validation/auth";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
  disabled?: boolean;
  // Mostra a força da senha e o que ainda falta (no cadastro).
  showStrength?: boolean;
  // Mostra se a confirmação confere com a senha (valor da senha original).
  matchWith?: string;
}

const BAR_COLORS = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-emerald-600"];
const TEXT_COLORS = ["text-red-600", "text-orange-600", "text-yellow-700", "text-green-600", "text-emerald-700"];

// Campo de senha com o olho para mostrar/ocultar. No cadastro mostra a força e a lista do que falta, como no app.
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  showStrength,
  matchWith,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  const missing = passwordRequirements(value).filter((requirement) => !requirement.met);
  const checkingMatch = matchWith !== undefined && value !== "";
  const matches = checkingMatch && value === matchWith;

  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700 block">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Lock size={18} />
        </div>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={checkingMatch && !matches}
          className={`w-full pl-10 pr-11 py-3 rounded-xl border focus:ring-2 bg-white text-sm outline-none transition-all ${
            checkingMatch ? (matches ? "border-green-400 focus:ring-green-500" : "border-red-400 focus:ring-red-400") : "border-gray-300 focus:ring-green-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="rc-password-toggle absolute right-1 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1 mb-1" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${bar <= strength.score ? BAR_COLORS[Math.max(0, strength.score - 1)] : "bg-gray-200"}`}
              />
            ))}
          </div>
          <p className={`text-xs font-bold ${TEXT_COLORS[Math.max(0, strength.score - 1)]}`}>{strength.label}</p>
          {missing.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {missing.map((requirement) => (
                <li key={requirement.label} className="text-xs text-gray-500">
                  Falta: {requirement.label.charAt(0).toLowerCase() + requirement.label.slice(1)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {checkingMatch && (
        <p className={`text-xs font-medium mt-1 ${matches ? "text-green-600" : "text-red-500"}`} aria-live="polite">
          {matches ? "Senhas conferem!" : "As senhas não coincidem."}
        </p>
      )}
    </div>
  );
}
