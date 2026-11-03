"use client";

import { useState } from "react";
import { ShieldPlus, Trash2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "@/components/ui/SearchBar";
import { filterUsers, userName, type AdminUser, type UserFilters } from "@/lib/admin/types";

interface UsersTabProps {
  users: AdminUser[];
  busyEmail: string | null;
  onDetails: (user: AdminUser) => void;
  onSuspend: (user: AdminUser) => void;
  onReactivate: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onNewAdmin: () => void;
}

const KIND_VARIANT = { produtor: "success", admin: "warning", mercado: "neutral" } as const;
const STATUS_VARIANT = { APROVADO: "success", SUSPENSO: "warning", REJEITADO: "danger", EM_ANALISE: "info" } as const;
const NO_FILTERS: UserFilters = { query: "", kind: "todos", status: "todos" };

export function UsersTab({ users, busyEmail, onDetails, onSuspend, onReactivate, onDelete, onNewAdmin }: UsersTabProps) {
  const [filters, setFilters] = useState<UserFilters>(NO_FILTERS);
  const list = filterUsers(users, filters);
  const filtering = filters.query !== "" || filters.kind !== "todos" || filters.status !== "todos";

  return (
    <Card flat className="overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="rc-section-title ml-2">Usuários na base de dados</h2>
          <Button onClick={onNewAdmin} className="whitespace-nowrap bg-gray-900 hover:bg-black">
            <ShieldPlus size={17} aria-hidden="true" /> Novo admin
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchBar value={filters.query} onChange={(query) => setFilters({ ...filters, query })} placeholder="Buscar por nome ou e-mail..." accent="blue" className="flex-1" />
          <select aria-label="Filtrar por tipo" value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value as UserFilters["kind"] })} className="rc-select w-full sm:w-40 text-sm">
            <option value="todos">Todos os tipos</option>
            <option value="produtor">Produtor</option>
            <option value="mercado">Mercado</option>
            <option value="admin">Admin</option>
          </select>
          <select aria-label="Filtrar por situação" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as UserFilters["status"] })} className="rc-select w-full sm:w-44 text-sm">
            <option value="todos">Todas as situações</option>
            <option value="APROVADO">Aprovado</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="REJEITADO">Rejeitado</option>
          </select>
        </div>
        {filtering && (
          <p className="flex items-center gap-2 text-xs text-gray-500" aria-live="polite">
            {list.length} resultado(s)
            <button type="button" onClick={() => setFilters(NO_FILTERS)} className="text-blue-600 hover:underline font-bold">Limpar filtros</button>
          </p>
        )}
      </div>

      {list.length === 0 ? (
        <p className="p-10 text-center text-gray-400 font-medium">Nenhum usuário encontrado.</p>
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="hidden md:block overflow-x-auto no-scrollbar">
            <table className="rc-table min-w-175">
              <caption className="sr-only">Usuários cadastrados</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Usuário</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Documento</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((user) => (
                  <tr key={user.email}>
                    <td className="pl-6">
                      <p className="font-bold text-gray-900">{userName(user)}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td><Badge variant={KIND_VARIANT[user.tipo]}>{user.tipo}</Badge></td>
                    <td>
                      <p className="text-xs text-gray-700 font-semibold">{user.tipoDoc || "—"}</p>
                      <p className="text-xs text-gray-400">{user.documento || "—"}</p>
                    </td>
                    <td><Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge></td>
                    <td className="pr-6"><UserActions user={user} busy={busyEmail === user.email} onDetails={onDetails} onSuspend={onSuspend} onReactivate={onReactivate} onDelete={onDelete} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: um cartão por usuário */}
          <ul className="md:hidden divide-y divide-gray-100">
            {list.map((user) => (
              <li key={user.email} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{userName(user)}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={KIND_VARIANT[user.tipo]}>{user.tipo}</Badge>
                    <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
                  </div>
                </div>
                <UserActions user={user} busy={busyEmail === user.email} onDetails={onDetails} onSuspend={onSuspend} onReactivate={onReactivate} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function UserActions({ user, busy, onDetails, onSuspend, onReactivate, onDelete }: { user: AdminUser; busy: boolean } & Pick<UsersTabProps, "onDetails" | "onSuspend" | "onReactivate" | "onDelete">) {
  const name = userName(user);
  const managed = user.tipo !== "admin";
  return (
    <div className="flex justify-end items-center gap-2">
      <button
        type="button"
        onClick={() => onDetails(user)}
        className="px-3 h-10 flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
        aria-label={`Detalhes de ${name}`}
      >
        <UserCog size={14} aria-hidden="true" /> Detalhes
      </button>
      {managed && (
        user.status === "APROVADO" ? (
          <Button onClick={() => onSuspend(user)} isLoading={busy} variant="outline" size="sm" className="h-10 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-50" aria-label={`Suspender ${name}`}>Suspender</Button>
        ) : (
          <Button onClick={() => onReactivate(user)} isLoading={busy} variant="outline" size="sm" className="h-10 px-3 text-xs border-green-300 text-green-700 hover:bg-green-50" aria-label={`Reativar ${name}`}>Reativar</Button>
        )
      )}
      {managed && (
        <button
          type="button"
          onClick={() => onDelete(user)}
          disabled={busy}
          className="px-3 h-10 flex items-center text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50"
          aria-label={`Excluir ${name}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
