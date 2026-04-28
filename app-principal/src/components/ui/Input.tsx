// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

// Usamos forwardRef para permitir integrações com bibliotecas de formulário
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", id, ...props }, ref) => {

        // Gera um ID aleatório se não for fornecido, para ligar a label ao input
        const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className={`flex flex-col gap-1 w-full ${className}`}>
                <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
                    {label}
                </label>

                <input
                    id={inputId}
                    ref={ref}
                    className={`
            px-4 py-3 rounded-lg border bg-white text-gray-900 
            transition-colors duration-200 outline-none
            focus:ring-2 focus:ring-green-500/50 focus:border-green-500
            disabled:bg-gray-100 disabled:text-gray-500
            ${error ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : "border-gray-300"}
          `}
                    {...props}
                />

                {/* Espaço reservado para a mensagem de erro */}
                
                {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";