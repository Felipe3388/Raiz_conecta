import { ProdutorProvider } from "@/components/produtor/ProdutorProvider";
import { ProdutorShell } from "@/components/produtor/ProdutorShell";

// Toda a área do Produtor: carrega o produtor uma vez e mostra o menu (lateral no computador, abas no celular).
export default function ProdutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProdutorProvider>
      <ProdutorShell>{children}</ProdutorShell>
    </ProdutorProvider>
  );
}
