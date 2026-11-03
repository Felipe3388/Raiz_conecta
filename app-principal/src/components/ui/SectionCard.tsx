import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const TONES = {
  green: { text: "text-green-700", tile: "bg-green-100 text-green-600" },
  blue: { text: "text-blue-600", tile: "bg-blue-100 text-blue-600" },
  amber: { text: "text-amber-500", tile: "bg-amber-100 text-amber-600" },
  red: { text: "text-red-600", tile: "bg-red-100 text-red-600" },
} as const;

export type SectionTone = keyof typeof TONES;

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  tone?: SectionTone;
  // Com descrição, o cartão ganha um cabeçalho destacado (formulários longos, como o perfil).
  // Sem ela, é o cartão compacto das telas do produtor (título com ícone e o conteúdo logo abaixo).
  description?: string;
  // Algo à direita do título (um botão, um selo).
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

// O bloco padrão de conteúdo do site: um cartão branco com título e ícone.
export function SectionCard({ title, icon: Icon, tone = "green", description, action, children, className = "" }: SectionCardProps) {
  const look = TONES[tone];

  if (description) {
    return (
      <section className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
        <div className="bg-gray-50/50 p-6 md:p-8 border-b border-gray-100 flex gap-5 items-start">
          <div className={`${look.tile} p-3.5 rounded-2xl shadow-sm shrink-0`}><Icon size={28} aria-hidden="true" /></div>
          <div className="flex-1 min-w-0">
            <h2>{title}</h2>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">{description}</p>
          </div>
          {action}
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </section>
    );
  }

  return (
    <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base">
          <Icon size={19} className={look.text} aria-hidden="true" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
