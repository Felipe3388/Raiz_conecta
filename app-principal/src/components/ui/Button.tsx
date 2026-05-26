import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost" | "danger";
    isLoading?: boolean;
}

export function Button({ children, variant = "primary", isLoading, className = "", ...props }: ButtonProps) {
    // A mágica está aqui: transition-all, hover e active:scale-95
    const base = "px-6 py-3 font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-sm hover:shadow-md";

    const variants = {
        primary: "bg-green-600 text-white hover:bg-green-700",
        outline: "border-2 border-green-600 text-green-700 hover:bg-green-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700"
    };

    return (
        <button disabled={isLoading || props.disabled} className={`${base} ${variants[variant]} ${className}`} {...props}>
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {children}
        </button>
    );
}