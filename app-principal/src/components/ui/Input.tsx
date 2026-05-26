import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon | React.ElementType; 
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, className = "", ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-sm font-semibold text-gray-700 block">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {/* Renderiza o ícone dentro do input se ele for passado */}
                    {Icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        // Se tiver ícone, aumenta o padding da esquerda (pl-10) para o texto não ficar em cima dele
                        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white text-sm outline-none transition-all ${className}`}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

Input.displayName = "Input";