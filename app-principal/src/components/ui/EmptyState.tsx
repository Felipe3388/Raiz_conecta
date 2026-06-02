import { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className = "" }: EmptyStateProps) {
  return (
    <div className={`rc-empty-state ${className}`}>
      <div className="rc-empty-icon">{icon}</div>
      <h3 className="rc-empty-title">{title}</h3>
      {description && <p className="rc-empty-desc">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 mx-auto">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
