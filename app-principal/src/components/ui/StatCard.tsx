import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  // Só "amber" e "red" mudam o ícone: são avisos. As outras cores ficam no verde da marca (uma cor, um significado).
  color?: "blue" | "green" | "orange" | "purple" | "amber" | "red";
  className?: string;
}

const ICON_TONE = { amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700" } as const;

export function StatCard({ label, value, icon, color = "green", className = "" }: StatCardProps) {
  const tone = color === "amber" || color === "red" ? ICON_TONE[color] : "bg-green-50 text-green-700";
  return (
    <div className={`rc-stat-card ${className}`}>
      <div className="min-w-0">
        <p className="rc-stat-label">{label}</p>
        <p className="rc-stat-value">{value}</p>
      </div>
      <div className={`rc-stat-icon ${tone}`}>{icon}</div>
    </div>
  );
}
