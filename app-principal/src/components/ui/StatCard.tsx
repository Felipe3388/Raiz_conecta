import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "purple" | "amber" | "red";
  className?: string;
}

const colorMap = {
  blue:   { border: "border-l-blue-500",   bg: "bg-blue-50",   text: "text-blue-600"   },
  green:  { border: "border-l-green-500",  bg: "bg-green-50",  text: "text-green-600"  },
  orange: { border: "border-l-orange-500", bg: "bg-orange-50", text: "text-orange-600" },
  purple: { border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-600" },
  amber:  { border: "border-l-amber-500",  bg: "bg-amber-50",  text: "text-amber-600"  },
  red:    { border: "border-l-red-500",    bg: "bg-red-50",    text: "text-red-600"    },
};

export function StatCard({ label, value, icon, color, className = "" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rc-stat-card border-l-4 ${c.border} ${className}`}>
      <div>
        <p className="rc-stat-label">{label}</p>
        <h3 className="rc-stat-value">{value}</h3>
      </div>
      <div className={`rc-stat-icon ${c.bg} ${c.text}`}>
        {icon}
      </div>
    </div>
  );
}
