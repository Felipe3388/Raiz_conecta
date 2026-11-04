import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Button({ children, variant = "primary", isLoading, size = "md", className = "", ...props }: ButtonProps) {
  // Sem "pular" ao passar o mouse: a cor muda e o toque afunda um pouco (resposta ao clique, não decoração).
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 active:scale-[0.98]";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700",
    outline: "border-2 border-green-600 text-green-800 hover:bg-green-50",
    ghost:   "bg-transparent text-gray-700 hover:bg-gray-100",
    danger:  "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={17} />}
      {children}
    </button>
  );
}
