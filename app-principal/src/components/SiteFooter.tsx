import Link from "next/link";
import { Leaf } from "lucide-react";

// Ícone SVG do Instagram (lucide não tem a versão oficial)
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-green-900 text-white pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-green-800">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-700 p-2 rounded-xl">
                <Leaf className="text-green-300" size={22} />
              </div>
              <span className="text-xl font-black tracking-tight">
                Raiz<span className="text-green-400">Conecta</span>
              </span>
            </div>
            <p className="text-green-300 text-sm leading-relaxed">
              Conectando produtores rurais diretamente aos mercados. Sem atravessadores, com transparência e tecnologia.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-black text-green-200 uppercase tracking-wider text-xs mb-4">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-green-300">
              {[
                { href: "/#sobre",          label: "Sobre o Projeto" },
                { href: "/#como-funciona",  label: "Como Funciona"   },
                { href: "/#funcionalidades",label: "Vantagens"        },
                { href: "/api-docs",        label: "API Docs"         },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors cursor-pointer">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes sociais */}
          <div>
            <h4 className="font-black text-green-200 uppercase tracking-wider text-xs mb-4">Siga-nos</h4>
            <a
              href="https://www.instagram.com/raizconecta_dsm?igsh=MW1qcTRlejM0NHZrbQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-800 hover:bg-linear-to-r hover:from-purple-600 hover:to-pink-500 text-white px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm cursor-pointer"
            >
              <InstagramIcon size={20} />
              <span>@raizconecta_dsm</span>
            </a>
            <p className="text-green-400 text-xs mt-3">Acompanhe novidades, atualizações e histórias do campo.</p>
          </div>
        </div>

        {/* Rodapé base */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-green-500">
          <p>© {new Date().getFullYear()} Raiz Conecta. Todos os direitos reservados.</p>
          <p>Feito com 🌱 para o agronegócio brasileiro</p>
        </div>
      </div>
    </footer>
  );
}
