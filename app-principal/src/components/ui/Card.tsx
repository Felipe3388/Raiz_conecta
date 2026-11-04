import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  flat?: boolean;
}

export function Card({ children, className = "", flat = false }: CardProps) {
  const base = flat
    ? "rc-card-flat"
    : "bg-white rounded-2xl border border-gray-200";
  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
