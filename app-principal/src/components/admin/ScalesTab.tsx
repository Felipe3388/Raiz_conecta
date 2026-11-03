"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Radio, Scale, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import type { AdminScale } from "@/lib/admin/types";
import { timeAgo } from "@/lib/format/time";
import { api } from "@/lib/http/client";
import { formatDeviceId, isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { CopyButton } from "./CopyButton";

interface ScalesTabProps {
  scales: AdminScale[];
  onChanged: () => void;
}

// O sinal das balanças muda a cada poucos segundos; a aba se atualiza sozinha enquanto está aberta e visível.
const REFRESH_MS = 8_000;

// O segredo só existe neste instante: depois só o hash fica no servidor.
interface RevealedSecret {
  scale: Pick<AdminScale, "nome" | "deviceId" | "codigo">;
  secret: string;
}

const idForUrl = (scale: AdminScale) => encodeURIComponent(scale.deviceId);

export function ScalesTab({ scales, onChanged }: ScalesTabProps) {
  const { confirm, dialog } = useConfirm();
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<RevealedSecret | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") onChanged();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [onChanged]);

  function rotateSecret(scale: AdminScale) {
    confirm({
      title: "Gerar novo segredo",
      description: `O segredo atual de "${scale.nome}" deixa de valer na hora. Será preciso gravar o novo no módulo.`,
      confirmLabel: "Gerar novo segredo",
      variant: "warning",
      run: async () => {
        const result = await api<{ segredo: string }>(`/api/admin/balancas/${idForUrl(scale)}/segredo`, { method: "POST" });
        if (!result.ok || !result.data) return void toast.error(result.error);
        setRevealed({ scale, secret: result.data.segredo });
      },
    });
  }

  function release(scale: AdminScale) {
    confirm({
      title: "Liberar balança",
      description: `A balança "${scale.nome}" será desvinculada de ${scale.emailProdutor} e o histórico de pesagens dela será apagado. Ela poderá ser vinculada de novo com o código da etiqueta.`,
      confirmLabel: "Liberar",
      variant: "warning",
      run: async () => {
        const result = await api(`/api/admin/balancas/${idForUrl(scale)}`, { method: "PATCH", json: { liberar: true } });
        if (!result.ok) return void toast.error(result.error);
        toast.success("Balança liberada.");
        onChanged();
      },
    });
  }

  function remove(scale: AdminScale) {
    confirm({
      title: "Excluir balança",
      description: `Apagar "${scale.nome}" do sistema, com todo o histórico? O módulo deixa de conseguir enviar pesos.`,
      confirmLabel: "Excluir",
      variant: "danger",
      run: async () => {
        const result = await api(`/api/admin/balancas/${idForUrl(scale)}`, { method: "DELETE" });
        if (!result.ok) return void toast.error(result.error);
        toast.info("Balança excluída.");
        onChanged();
      },
    });
  }

  const online = scales.filter((scale) => scale.online).length;
  const free = scales.filter((scale) => !scale.emailProdutor).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="rc-section-title">Balanças</h2>
          <p className="text-sm text-gray-500 mt-0.5" aria-live="polite">
            {scales.length} cadastrada(s) · {online} com sinal · {free} livre(s) para vincular
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="h-11"><Plus size={17} aria-hidden="true" /> Cadastrar balança</Button>
      </div>

      {scales.length === 0 ? (
        <EmptyState
          icon={<Scale size={56} className="text-gray-300" aria-hidden="true" />}
          title="Nenhuma balança cadastrada"
          description="Cadastre o endereço MAC de cada módulo. O segredo e o código da etiqueta aparecem logo em seguida."
          actionLabel="Cadastrar balança"
          onAction={() => setCreating(true)}
        />
      ) : (
        <Card flat className="overflow-hidden">
          <div className="hidden lg:block overflow-x-auto no-scrollbar">
            <table className="rc-table min-w-200">
              <caption className="sr-only">Balanças cadastradas</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Balança</th>
                  <th scope="col">Etiqueta</th>
                  <th scope="col">Produtor</th>
                  <th scope="col">Sinal</th>
                  <th scope="col">Último peso</th>
                  <th scope="col" className="text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {scales.map((scale) => (
                  <tr key={scale.deviceId}>
                    <td className="pl-6">
                      <p className="font-bold text-gray-900">{scale.apelido || scale.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{scale.deviceId}</p>
                      {scale.firmware && <p className="text-[11px] text-gray-400">firmware {scale.firmware}</p>}
                    </td>
                    <td><div className="flex items-center gap-2"><code className="text-sm font-mono font-bold tracking-wider text-gray-800">{scale.codigo}</code><CopyButton value={scale.codigo} label="código da etiqueta" /></div></td>
                    <td>{scale.emailProdutor ? <span className="text-sm text-gray-700 break-all">{scale.emailProdutor}</span> : <Badge variant="info">Livre</Badge>}</td>
                    <td><Signal scale={scale} /></td>
                    <td><LastWeight scale={scale} /></td>
                    <td className="pr-6"><ScaleActions scale={scale} onRotate={rotateSecret} onRelease={release} onRemove={remove} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="lg:hidden divide-y divide-gray-100">
            {scales.map((scale) => (
              <li key={scale.deviceId} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{scale.apelido || scale.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{scale.deviceId}</p>
                  </div>
                  <Signal scale={scale} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Etiqueta</span>
                  <span className="flex items-center gap-2"><code className="font-mono font-bold tracking-wider">{scale.codigo}</code><CopyButton value={scale.codigo} label="código da etiqueta" /></span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Produtor</span>
                  {scale.emailProdutor ? <span className="text-gray-700 truncate">{scale.emailProdutor}</span> : <Badge variant="info">Livre</Badge>}
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Último peso</span>
                  <LastWeight scale={scale} />
                </div>
                <ScaleActions scale={scale} onRotate={rotateSecret} onRelease={release} onRemove={remove} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CreateScaleModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={(secret) => {
          setRevealed(secret);
          onChanged();
        }}
      />
      <SecretModal revealed={revealed} onClose={() => setRevealed(null)} />
      {dialog}
    </div>
  );
}

function Signal({ scale }: { scale: AdminScale }) {
  if (scale.online) return <Badge variant="success" dot>Com sinal</Badge>;
  return (
    <span className="inline-flex flex-col items-start">
      <Badge variant="neutral" dot>Sem sinal</Badge>
      <span className="text-[11px] text-gray-400 mt-0.5">{scale.ultimoContato ? `visto ${timeAgo(scale.ultimoContato)}` : "nunca conectou"}</span>
    </span>
  );
}

function LastWeight({ scale }: { scale: AdminScale }) {
  if (scale.ultimoKg === null || !scale.emailProdutor) return <span className="text-sm text-gray-400">—</span>;
  return <span className="text-sm font-bold text-gray-800 tabular-nums">{scale.ultimoKg.toLocaleString("pt-BR", { minimumFractionDigits: 3 })} kg</span>;
}

function ScaleActions({ scale, onRotate, onRelease, onRemove }: { scale: AdminScale; onRotate: (s: AdminScale) => void; onRelease: (s: AdminScale) => void; onRemove: (s: AdminScale) => void }) {
  const name = scale.apelido || scale.nome;
  const base = "px-3 h-10 flex items-center gap-1 text-xs font-bold rounded-lg border transition";
  return (
    <div className="flex flex-wrap justify-end items-center gap-2">
      <button type="button" onClick={() => onRotate(scale)} aria-label={`Gerar novo segredo de ${name}`} className={`${base} bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100`}>
        <KeyRound size={14} aria-hidden="true" /> Segredo
      </button>
      {scale.emailProdutor && (
        <button type="button" onClick={() => onRelease(scale)} aria-label={`Liberar ${name}`} className={`${base} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}>
          <Unlink size={14} aria-hidden="true" /> Liberar
        </button>
      )}
      <button type="button" onClick={() => onRemove(scale)} aria-label={`Excluir ${name}`} className={`${base} bg-red-50 text-red-500 border-red-200 hover:bg-red-100`}>
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function CreateScaleModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (secret: RevealedSecret) => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cadastrar balança">
      {isOpen && <CreateScaleForm onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function CreateScaleForm({ onClose, onCreated }: { onClose: () => void; onCreated: (secret: RevealedSecret) => void }) {
  const [mac, setMac] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidDeviceId(mac)) return setError("Informe o endereço MAC completo (12 letras e números, ex.: A4:CF:12:9B:07:E1).");
    setError("");

    setBusy(true);
    const result = await api<{ balanca: AdminScale; segredo: string }>("/api/admin/balancas", { method: "POST", json: { deviceId: mac, nome } });
    setBusy(false);
    if (!result.ok || !result.data) return setError(result.error);

    onCreated({ scale: result.data.balanca, secret: result.data.segredo });
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <p className="text-sm text-gray-500">O endereço MAC aparece no monitor serial do módulo (ESP32) quando ele liga.</p>
      <Input
        label="Endereço MAC"
        value={mac}
        onChange={(e) => setMac(formatDeviceId(normalizeDeviceId(e.target.value).slice(0, 12)))}
        placeholder="A4:CF:12:9B:07:E1"
        autoComplete="off"
        spellCheck={false}
        className="font-mono uppercase"
        error={error}
        data-autofocus
        required
      />
      <Input label="Nome de fábrica (opcional)" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} placeholder="Ex.: Balança RC-01" hint="Se ficar vazio, usamos “Balança RC-” e o final do MAC." />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
        <Button type="submit" isLoading={busy} className="flex-1">Cadastrar</Button>
      </div>
    </form>
  );
}

function SecretModal({ revealed, onClose }: { revealed: RevealedSecret | null; onClose: () => void }) {
  return (
    <Modal isOpen={revealed !== null} onClose={onClose} title="Segredo da balança" size="lg">
      {revealed && (
        <div className="space-y-4 mt-2">
          <div className="rc-banner rc-banner-amber rounded-xl text-sm">
            <Radio size={20} className="shrink-0" aria-hidden="true" />
            <p><strong>Guarde agora.</strong> Este segredo não aparece de novo: o servidor guarda só uma impressão digital dele. Grave-o no firmware do módulo.</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-gray-700">Balança</dt>
              <dd className="text-gray-600">{revealed.scale.nome} · <span className="font-mono">{revealed.scale.deviceId}</span></dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Segredo do módulo</dt>
              <dd className="mt-1 flex items-center gap-2">
                <code className="flex-1 min-w-0 break-all rounded-xl bg-gray-900 px-3 py-2.5 font-mono text-xs text-green-300 select-all">{revealed.secret}</code>
                <CopyButton value={revealed.secret} label="segredo" />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Código da etiqueta</dt>
              <dd className="mt-1 flex items-center gap-2">
                <code className="text-lg font-mono font-black tracking-widest text-gray-900">{revealed.scale.codigo}</code>
                <CopyButton value={revealed.scale.codigo} label="código da etiqueta" />
              </dd>
              <dd className="text-xs text-gray-500 mt-1">Cole na balança junto do MAC. É com ele que o produtor vincula a balança no app.</dd>
            </div>
          </dl>

          <Button onClick={onClose} className="w-full h-11">Já guardei o segredo</Button>
        </div>
      )}
    </Modal>
  );
}

