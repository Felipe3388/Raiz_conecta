"use client";

import { toast } from "sonner";
import { Headset } from "lucide-react";
import { ProfileEditor } from "@/components/perfil/ProfileEditor";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";
import { useProfileForm } from "@/hooks/useProfileForm";
import { SUPPORT_MESSAGE } from "@/lib/support";

// Meu Perfil do produtor, dentro da área dele (menu lateral / abas), como a tela Meu Perfil do app.
export default function ProdutorPerfilPage() {
  const { reloadProdutor } = useProdutor();
  const profile = useProfileForm({ onSaved: () => void reloadProdutor() });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeading
        title="Meu Perfil"
        subtitle="Seus dados, endereço de entrega e senha."
        action={
          <Button variant="outline" size="sm" onClick={() => toast.info(SUPPORT_MESSAGE)}>
            <Headset size={16} aria-hidden="true" /> Falar com o suporte
          </Button>
        }
      />
      <ProfileEditor profile={profile} aboveTabBar />
    </div>
  );
}
