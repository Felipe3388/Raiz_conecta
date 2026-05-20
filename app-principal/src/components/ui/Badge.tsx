interface BadgeProps {
    children: React.ReactNode;
    variant?: "success" | "warning" | "danger" | "neutral";
    className?: string; // <--- ADICIONE ESTA LINHA
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
    const variants = {
        success: "bg-green-100 text-green-800",
        warning: "bg-amber-100 text-amber-800",
        danger: "bg-red-100 text-red-800",
        neutral: "bg-gray-100 text-gray-800",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}