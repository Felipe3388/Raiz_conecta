import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  flat?: boolean;
}

export function Card({ children, className = "", flat = false }: CardProps) {
  const base = flat
    ? "rc-card-flat"
    : "bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1";
  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
