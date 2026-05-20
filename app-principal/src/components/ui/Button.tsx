import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost" | "danger";
    isLoading?: boolean;
}

export function Button({ children, variant = "primary", isLoading, className = "", ...props }: ButtonProps) {
    const base = "px-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50";
    const variants = {
        primary: "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]",
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