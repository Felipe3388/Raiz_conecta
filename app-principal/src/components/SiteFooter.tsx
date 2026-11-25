import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { SUPPORT_EMAIL } from "@/lib/support";

// Ícone do Instagram (a biblioteca de ícones não tem a marca oficial).
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const LINKS = [
  { title: "Plataforma", items: [{ href: "/#como-funciona", label: "Como funciona" }, { href: "/#para-quem", label: "Para quem é" }, { href: "/#balanca", label: "Balança conectada" }] },
  { title: "Conta", items: [{ href: "/login", label: "Entrar" }, { href: "/login?modo=cadastro", label: "Criar conta" }, { href: "/api-docs", label: "Documentação da API" }] },
];

export function SiteFooter() {
  return (
    <footer className="bg-mata text-green-100 mt-auto">
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] pb-10 border-b border-white/10">
          <div>
            <Wordmark look="dark" />
            <p className="mt-4 text-sm leading-relaxed max-w-[34ch]">
              Produtores rurais e mercados da mesma região, negociando direto, com a pesagem conferida.
            </p>
          </div>

          {LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-bold text-white mb-4">{group.title}</p>
              <ul className="space-y-2.5 text-sm">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-sm font-bold text-white mb-4">Contato</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="block text-sm hover:text-white transition-colors break-all">{SUPPORT_EMAIL}</a>
            <a
              href="https://www.instagram.com/raizconecta_dsm"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2.5 h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
            >
              <InstagramIcon size={18} /> @raizconecta_dsm
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-6 text-xs text-green-200/80">
          <p>© {new Date().getFullYear()} Raiz Conecta</p>
          <p>Projeto Interdisciplinar de Desenvolvimento de Software Multiplataforma, Fatec Votorantim</p>
        </div>
      </div>
    </footer>
  );
}
