// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost";
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) {

    // Estilos base para todos os botões
    const baseStyles = "px-6 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Estilos específicos de cada variante
    const variants = {
        primary: "bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg active:scale-[0.98]",
        outline: "bg-transparent text-green-700 border-2 border-green-600 hover:bg-green-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-green-700"
    };

    const widthStyle = fullWidth ? "w-full" : "w-auto";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}