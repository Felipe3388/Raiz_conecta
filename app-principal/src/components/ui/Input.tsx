import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon | React.ElementType;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, hint, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-gray-700 block">{label}</label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icon size={17} />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-3 rounded-xl border ${
              error ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-green-500"
            } focus:ring-2 bg-white text-sm outline-none transition-all ${className}`}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
