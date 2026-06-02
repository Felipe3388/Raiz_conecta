"use client";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  accent?: "green" | "blue" | "amber";
}

const accentRing = {
  green: "focus:ring-green-500 border-gray-300 focus:border-green-400",
  blue:  "focus:ring-blue-500 border-gray-300 focus:border-blue-400",
  amber: "focus:ring-amber-400 border-amber-200 focus:border-amber-400",
};

export function SearchBar({ value, onChange, placeholder = "Buscar...", className = "", accent = "green" }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rc-search-input focus:ring-2 outline-none ${accentRing[accent]}`}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
