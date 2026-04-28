import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    noPadding?: boolean;
}

export function Card({ children, noPadding = false, className = "", ...props }: CardProps) {
    return (
        <div
            className={`
        bg-white/90 backdrop-blur-sm border border-gray-100 
        rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300
        ${noPadding ? "" : "p-6 md:p-8"} 
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}