interface ProgressBarProps {
  value: number;       // 0–100
  color?: "green" | "blue" | "amber" | "red";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const colors = {
  green: "bg-green-500",
  blue:  "bg-blue-500",
  amber: "bg-amber-500",
  red:   "bg-red-500",
};

const sizes = { sm: "h-1.5", md: "h-2.5" };

export function ProgressBar({ value, color = "green", size = "md", label, className = "" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-bold text-gray-500 mb-1">{label} <span className="text-gray-400">{pct.toFixed(0)}%</span></p>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
