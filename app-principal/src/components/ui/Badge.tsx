interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  dot?: boolean;
  className?: string;
}

const variants = {
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger:  "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-700",
  info:    "bg-blue-100 text-blue-800",
};

const dots = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  neutral: "bg-gray-400",
  info:    "bg-blue-500",
};

export function Badge({ children, variant = "neutral", dot = false, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
}
