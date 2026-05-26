import type { Metadata } from "next";
import { Lato, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

import SiteHeader from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raiz Conecta",
  description: "Conectando produtores rurais a mercados locais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${lato.variable} ${sourceCodePro.variable} scroll-smooth`}>
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
