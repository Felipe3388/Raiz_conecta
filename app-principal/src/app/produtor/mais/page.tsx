"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FileText, LogOut, Mail, Scale, ShieldCheck, Smartphone, User } from "lucide-react";
import { PrivacidadeModal, TermosModal } from "@/components/legal/LegalModals";
import { useProdutor } from "@/components/produtor/ProdutorProvider";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { PageHeading } from "@/components/ui/PageHeading";
import { logout } from "@/lib/auth/logout";
import { scaleRowHint } from "@/lib/iot/label";
import { SUPPORT_MESSAGE } from "@/lib/support";

// Mais: a conta, a balança, os documentos e a saída, nos mesmos grupos da aba Mais do app.
export default function MaisPage() {
  const router = useRouter();
  const { produtor, scales } = useProdutor();
  const [termos, setTermos] = useState(false);
  const [privacidade, setPrivacidade] = useState(false);
  const scaleCount = scales.state?.scales.length ?? 0;

  async function leave() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeading title="Mais" />

      <Link href="/produtor/perfil" className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-black" aria-hidden="true">
          {(produtor.nomeFantasia ?? "P").trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-gray-900 truncate">{produtor.nomeFantasia ?? "Produtor"}</p>
          <p className="text-sm text-gray-500 truncate">{produtor.email}</p>
          {(produtor.cidade || produtor.estado) && <p className="text-xs text-gray-500">{[produtor.cidade, produtor.estado].filter(Boolean).join(" · ")}</p>}
        </div>
        <ChevronRight size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
      </Link>

      {scales.state && !scales.active && (
        <Link href="/produtor/balancas" className="rc-banner rc-banner-green hover:shadow-md transition-shadow">
          <Scale size={28} aria-hidden="true" className="shrink-0" />
          <div className="flex-1">
            <p className="font-black">Conecte sua balança</p>
            <p className="text-sm">Pese os pedidos sem digitar e acompanhe o peso ao vivo.</p>
          </div>
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      )}

      <ListGroup title="Minha conta">
        <ListRow icon={User} label="Meu Perfil" hint="Dados do cadastro, endereço e senha" href="/produtor/perfil" />
        <ListRow icon={Scale} label="Minha balança" hint={scales.state ? scaleRowHint(scales.activeName, scaleCount) : "Carregando…"} href="/produtor/balancas" />
      </ListGroup>

      <ListGroup title="Privacidade">
        <ListRow icon={FileText} label="Termos de Uso" onClick={() => setTermos(true)} />
        <ListRow icon={ShieldCheck} label="Política de Privacidade" onClick={() => setPrivacidade(true)} />
      </ListGroup>

      <ListGroup title="Ajuda">
        <ListRow icon={Smartphone} label="Pesagem no aplicativo" hint="Entregas e pesagem dos pedidos ficam no celular" href="/produtor/entregas" />
        <ListRow icon={Mail} label="Falar com Suporte" onClick={() => toast.info(SUPPORT_MESSAGE)} />
      </ListGroup>

      <ListGroup>
        <ListRow icon={LogOut} label="Sair da conta" onClick={leave} tone="danger" />
      </ListGroup>

      <TermosModal isOpen={termos} onClose={() => setTermos(false)} />
      <PrivacidadeModal isOpen={privacidade} onClose={() => setPrivacidade(false)} />
    </div>
  );
}
