import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  accent?: "green" | "amber" | "blue";
}

const accentRing = {
  green: "focus:ring-green-500",
  amber: "focus:ring-amber-500",
  blue:  "focus:ring-blue-500",
};

export function Select({ label, options, accent = "green", className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-semibold text-gray-700 block">{label}</label>}
      <select
        className={`rc-select focus:ring-2 ${accentRing[accent]} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
