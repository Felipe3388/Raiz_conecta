"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Headset } from "lucide-react";
import { ProfileEditor } from "@/components/perfil/ProfileEditor";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProfileForm } from "@/hooks/useProfileForm";
import { useSession } from "@/hooks/useSession";
import { SUPPORT_MESSAGE } from "@/lib/support";

// Meu perfil do mercado. O produtor tem o dele dentro da área do produtor (/produtor/perfil), como no app.
export default function MeuPerfil() {
  const router = useRouter();
  const { session } = useSession();
  const profile = useProfileForm();
  const isProdutor = session?.role === "produtor";

  useEffect(() => {
    if (isProdutor) router.replace("/produtor/perfil");
  }, [isProdutor, router]);

  if (isProdutor) return <PageLoader message="Abrindo seu perfil..." />;

  return (
    <div className="rc-page p-4 md:p-8 pb-24">
      <div className="max-w-200 mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button type="button" onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-green-700 font-bold mb-4 h-11">
              <ArrowLeft className="mr-2" size={18} aria-hidden="true" /> Voltar
            </button>
            <h1 className="!text-3xl tracking-tight">Configurações da conta</h1>
            <div className="mt-2"><Badge variant="neutral">Perfil: Mercado</Badge></div>
          </div>
          <Button onClick={() => toast.info(SUPPORT_MESSAGE)} variant="outline" className="bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
            <Headset size={18} aria-hidden="true" /> Falar com o suporte
          </Button>
        </motion.div>
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}
