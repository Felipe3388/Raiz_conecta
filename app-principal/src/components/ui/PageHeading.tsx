import type { ReactNode } from "react";

// O título de cada tela: um nome curto e uma linha de apoio (como no app), com uma ação opcional à direita.
export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="!text-3xl md:!text-[2.15rem] !font-extrabold tracking-[-0.025em]">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
