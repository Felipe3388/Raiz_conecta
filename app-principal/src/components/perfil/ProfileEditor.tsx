"use client";

import { AlertTriangle, Lock, MapPin, Save, ShieldCheck, Trash2, User } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { AddressFields } from "@/components/forms/AddressFields";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/PageLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import type { ProfileFormController } from "@/hooks/useProfileForm";
import { maskDocumento } from "@/lib/format/mask";
import { maskPhone } from "@/lib/validation/auth";

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">{label} <Lock size={11} aria-label="não editável" /></p>
      <p className="w-full bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 font-medium break-all">{value}</p>
    </div>
  );
}

// O formulário do "Meu perfil", igual para produtor e mercado: dados, endereço, senha, salvar e excluir conta.
// Quem usa só decide a moldura da página (área do produtor ou página solta do mercado).
// `aboveTabBar`: na área do produtor, no celular, a barra de salvar fica acima da barra de abas.
export function ProfileEditor({ profile, aboveTabBar = false }: { profile: ProfileFormController; aboveTabBar?: boolean }) {
  const { dto, form } = profile;

  if (!dto || !form) {
    return profile.error ? (
      <EmptyState icon={<AlertTriangle size={56} className="text-red-300" aria-hidden="true" />} title="Não foi possível abrir seu perfil" description={profile.error} actionLabel="Tentar de novo" onAction={() => void profile.reload()} />
    ) : (
      <PageLoader message="Carregando perfil..." />
    );
  }

  const documento = dto.documento ? maskDocumento(dto.tipoDoc || "CPF", dto.documento) : "Não informado";

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={profile.confirming === "save"}
        onClose={profile.cancel}
        onConfirm={profile.save}
        title="Salvar alterações?"
        description={profile.changingPassword ? "Seus dados e sua senha serão atualizados agora." : "As mudanças valem imediatamente para o seu perfil na plataforma."}
        confirmLabel="Sim, salvar"
        cancelLabel="Revisar"
        variant="success"
        isLoading={profile.busy}
      />
      <ConfirmModal
        isOpen={profile.confirming === "delete"}
        onClose={profile.cancel}
        onConfirm={profile.removeAccount}
        title="Excluir conta?"
        description="Esta ação é irreversível: seus dados serão apagados do sistema. Contas com pedidos ou ofertas ligados não podem ser excluídas."
        confirmLabel="Sim, excluir tudo"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={profile.busy}
      />

      <SectionCard icon={User} tone="green" title="Dados principais" description="Informações que identificam o seu negócio na Raiz Conecta.">
        <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6">
          <ReadOnly label="E-mail de acesso" value={dto.email} />
          <ReadOnly label={`Documento (${dto.tipoDoc || "CPF/CNPJ"})`} value={documento} />
          <p className="md:col-span-2 text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-green-600" aria-hidden="true" /> Dados sensíveis ficam travados por segurança. Fale com o suporte para alterar.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Input label="Nome fantasia / Razão social" name="nomeFantasia" autoComplete="organization" value={form.nomeFantasia} onChange={(e) => profile.update({ nomeFantasia: e.target.value })} />
          <Input label="Telefone / WhatsApp" name="telefone" type="tel" autoComplete="tel" value={form.telefone} onChange={(e) => profile.update({ telefone: maskPhone(e.target.value) })} placeholder="(14) 99999-9999" />
        </div>
      </SectionCard>

      <SectionCard icon={MapPin} tone="blue" title="Endereço de operação" description="Usado para combinar a entrega entre produtor e mercado.">
        <AddressFields value={form} onChange={profile.update} />
      </SectionCard>

      <SectionCard icon={Lock} tone="amber" title="Senha e segurança" description="Preencha só se quiser trocar a senha. Pedimos a atual para garantir que é você.">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2"><PasswordField label="Senha atual" value={profile.passwords.atual} onChange={(value) => profile.setPassword("atual", value)} autoComplete="current-password" /></div>
          <PasswordField label="Nova senha" value={profile.passwords.nova} onChange={(value) => profile.setPassword("nova", value)} autoComplete="new-password" showStrength />
          <PasswordField label="Confirmar nova senha" value={profile.passwords.confirmar} onChange={(value) => profile.setPassword("confirmar", value)} autoComplete="new-password" matchWith={profile.passwords.nova} />
        </div>
      </SectionCard>

      {/* Barra de salvar: fica presa no pé da tela enquanto a pessoa rola o formulário. */}
      <div className={`sticky ${aboveTabBar ? "bottom-20 lg:bottom-0" : "bottom-0"} -mx-4 md:mx-0 px-4 md:px-0 py-3 bg-[#F8FAFC]/90 backdrop-blur flex items-center justify-end gap-4 z-10`}>
        {profile.dirty && <p className="text-sm text-amber-700 font-bold" role="status">Alterações não salvas</p>}
        <Button onClick={profile.requestSave} disabled={!profile.dirty} className="h-14 px-10 text-lg shadow-xl shadow-green-200">
          <Save size={20} aria-hidden="true" /> Salvar alterações
        </Button>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex gap-5 items-start">
          <div className="bg-red-100 text-red-600 p-3.5 rounded-2xl shrink-0"><AlertTriangle size={28} aria-hidden="true" /></div>
          <div>
            <h2 className="!text-red-700">Zona de perigo</h2>
            <p className="text-red-700/80 text-sm mt-1 leading-relaxed font-medium">Excluir a conta é irreversível. Seus dados são apagados do sistema.</p>
          </div>
        </div>
        <Button onClick={profile.requestDelete} variant="outline" className="w-full md:w-auto shrink-0 h-12 text-red-600 border-red-300 hover:bg-red-600 hover:text-white">
          <Trash2 size={18} aria-hidden="true" /> Excluir conta
        </Button>
      </div>
    </div>
  );
}
