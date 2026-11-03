"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoRow } from "@/components/ui/InfoRow";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { userName, type AdminUser } from "@/lib/admin/types";
import { api } from "@/lib/http/client";
import { maskPhone } from "@/lib/validation/auth";

interface UserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_VARIANT = { produtor: "success", admin: "warning", mercado: "neutral" } as const;
const STATUS_VARIANT = { APROVADO: "success", SUSPENSO: "warning", REJEITADO: "danger", EM_ANALISE: "info" } as const;

export function UserModal({ user, onClose, onSaved }: UserModalProps) {
  return (
    <Modal isOpen={user !== null} onClose={onClose} title="Detalhes do usuário">
      {user && <UserDetails key={user.email} user={user} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function UserDetails({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nomeFantasia: userName(user) === user.email ? "" : userName(user), telefone: user.telefone ?? "", cidade: user.cidade ?? "", estado: user.estado ?? "" });

  async function save() {
    setBusy(true);
    const result = await api("/api/admin/usuarios", { method: "PATCH", json: { email: user.email, tipo: user.tipo, ...form } });
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success("Dados atualizados.");
    setEditing(false);
    onSaved();
    onClose();
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={KIND_VARIANT[user.tipo]}>{user.tipo}</Badge>
          <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
        </div>
        {!editing && user.tipo !== "admin" && (
          <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 h-10 px-2 text-xs font-bold text-blue-600 hover:text-blue-800">
            <Edit2 size={13} aria-hidden="true" /> Editar
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-0.5">
        <InfoRow label="E-mail" value={user.email} />
        {!editing ? (
          <>
            <InfoRow label="Nome" value={userName(user) === user.email ? null : userName(user)} />
            <InfoRow label="Telefone" value={user.telefone} />
            <InfoRow label="Cidade" value={user.cidade ? `${user.cidade} / ${user.estado ?? "—"}` : null} />
            <InfoRow label="Documento" value={user.documento ? `${user.tipoDoc ?? "Doc"}: ${user.documento}` : null} />
          </>
        ) : (
          <div className="space-y-3 pt-2">
            <Input label="Nome / razão social" value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} data-autofocus />
            <Input label="Telefone" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
            <div className="flex gap-3">
              <Input label="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              <Input label="UF" maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} className="w-20 uppercase" />
            </div>
          </div>
        )}
      </div>

      {user.urlDocumento && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <p className="text-xs font-bold text-gray-500 px-4 py-2.5 bg-gray-50 border-b border-gray-100">Documento enviado</p>
          {/\.pdf($|\?)/i.test(user.urlDocumento) ? (
            <p className="p-4 text-sm text-gray-500">O documento é um PDF. Abra em uma nova aba para conferir.</p>
          ) : (
            <div className="relative w-full h-48 bg-gray-100">
              <Image src={user.urlDocumento} alt="Documento enviado pelo usuário" fill className="object-contain" sizes="(max-width: 640px) 100vw, 576px" />
            </div>
          )}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <a href={user.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              <Eye size={13} aria-hidden="true" /> Abrir em nova aba
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1 border-gray-200 text-gray-600">Fechar</Button>
        {editing && <Button isLoading={busy} onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar alterações</Button>}
      </div>
    </div>
  );
}
