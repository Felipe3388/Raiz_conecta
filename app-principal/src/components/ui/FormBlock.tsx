import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const TONES = { green: "text-green-600", blue: "text-blue-500", amber: "text-amber-500" } as const;

// Um grupo de campos de formulário com título (fieldset + legend, para leitores de tela anunciarem o grupo).
export function FormBlock({ title, icon: Icon, tone = "green", children }: { title: string; icon: LucideIcon; tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <fieldset className="rc-form-block">
      <legend className="sr-only">{title}</legend>
      <p className="rc-form-block-title text-base" aria-hidden="true"><Icon size={18} className={TONES[tone]} /> {title}</p>
      {children}
    </fieldset>
  );
}
