import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

import SiteHeader from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Figtree para a interface (clara em tamanho pequeno, números legíveis) e Bricolage Grotesque para os títulos: uma
// grotesca com traço um pouco artesanal, que dá voz à marca sem perder a leitura.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raiz Conecta",
  description: "O mercado pede, o produtor da região responde e a balança confere cada quilo. Cotação, oferta e pesagem sem atravessador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${bricolage.variable} scroll-smooth`}>
      {/* Microsoft Clarity Analytics */}
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wv2ah2u8lu");
          `,
        }}
      />
      <body className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 antialiased">
        <SiteHeader />
        <main className="grow">{children}</main>
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
        />
        <SiteFooter />
      </body>
    </html>
  );
}
