import { CheckCircle, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoRow } from "@/components/ui/InfoRow";
import { userName, type AdminUser } from "@/lib/admin/types";

interface PendingTabProps {
  users: AdminUser[];
  busyEmail: string | null;
  onDecide: (user: AdminUser, status: "APROVADO" | "REJEITADO") => void;
}

export function PendingTab({ users, busyEmail, onDecide }: PendingTabProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle size={56} className="text-green-300" aria-hidden="true" />}
        title="Tudo limpo por aqui!"
        description="Não há novos cadastros aguardando aprovação."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {users.map((user) => (
        <Card key={user.email} flat className="p-6 border-amber-200 bg-amber-50/30 flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-4 border-b border-amber-100">
              <Badge variant={user.tipo === "produtor" ? "success" : "neutral"} className="mb-2">
                {user.tipo === "produtor" ? "Produtor rural" : "Mercado"}
              </Badge>
              <h3 className="text-xl font-bold text-gray-900 mt-1 break-words">{userName(user)}</h3>
              <p className="text-xs text-gray-500 mt-0.5 break-all">{user.email}</p>
            </div>
            <div className="space-y-1 mb-6">
              <InfoRow label={user.tipoDoc || "Documento"} value={user.documento} />
              <InfoRow label="Telefone" value={user.telefone} />
              <InfoRow label="Cidade" value={user.cidade ? `${user.cidade} — ${user.estado ?? ""}` : null} />
              {user.urlDocumento && (
                <a
                  href={user.urlDocumento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline mt-2 pt-2 border-t border-gray-100 w-full"
                >
                  <FileText size={14} aria-hidden="true" /> Ver documento enviado
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => onDecide(user, "REJEITADO")}
              isLoading={busyEmail === user.email}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-11"
              aria-label={`Recusar ${userName(user)}`}
            >
              <XCircle size={17} aria-hidden="true" /> Recusar
            </Button>
            <Button onClick={() => onDecide(user, "APROVADO")} isLoading={busyEmail === user.email} className="flex-1 h-11" aria-label={`Aprovar ${userName(user)}`}>
              <CheckCircle size={17} aria-hidden="true" /> Aprovar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
