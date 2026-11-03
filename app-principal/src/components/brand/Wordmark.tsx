import Link from "next/link";
import { BrandMark } from "./BrandMark";

const LOOKS = {
  // Fundo claro (cabeçalho, login): ícone verde que inverte ao passar o mouse.
  light: { tile: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white", name: "text-gray-900", accent: "text-green-600" },
  // Fundo verde-escuro (rodapé).
  dark: { tile: "bg-green-700 text-green-300", name: "text-white", accent: "text-green-400" },
} as const;

const SIZES = { md: { mark: 26, text: "text-2xl", pad: "p-2" }, lg: { mark: 30, text: "text-3xl", pad: "p-2.5" } } as const;

// "RaizConecta" com a logo: o único lugar que desenha a marca no site. Com `href`, vira link.
export function Wordmark({ look = "light", size = "md", href }: { look?: keyof typeof LOOKS; size?: keyof typeof SIZES; href?: string }) {
  const c = LOOKS[look];
  const s = SIZES[size];
  const content = (
    <>
      <span className={`${s.pad} rounded-xl transition-colors ${c.tile}`}><BrandMark size={s.mark} /></span>
      <span className={`${s.text} font-black tracking-tight ${c.name}`}>
        Raiz<span className={c.accent}>Conecta</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="inline-flex items-center gap-2 group" aria-label="Raiz Conecta — página inicial">{content}</Link>
  ) : (
    <span className="inline-flex items-center gap-2">{content}</span>
  );
}
