import { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ icon, title, subtitle, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="rc-section-icon">
            {icon}
          </div>
        )}
        <div>
          <h2 className="rc-section-title">{title}</h2>
          {subtitle && <p className="rc-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
