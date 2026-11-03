import { Activity, Leaf, Package, Radio, Store, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { plural } from "@/lib/format/plural";
import { isPending, userName, type AdminProduct, type AdminScale, type AdminSuggestion, type AdminUser } from "@/lib/admin/types";

interface OverviewTabProps {
  users: AdminUser[];
  products: AdminProduct[];
  suggestions: AdminSuggestion[];
  scales: AdminScale[];
}

const KIND_VARIANT = { produtor: "success", admin: "warning", mercado: "neutral" } as const;

export function OverviewTab({ users, products, suggestions, scales }: OverviewTabProps) {
  const pending = users.filter(isPending).length;
  const suspended = users.filter((user) => user.status === "SUSPENSO").length;
  const approved = (kind: AdminUser["tipo"]) => users.filter((user) => user.tipo === kind && user.status === "APROVADO").length;
  const active = products.filter((product) => product.status !== "INATIVO").length;
  const offline = scales.filter((scale) => scale.emailProdutor && !scale.online).length;
  const recent = users.filter((user) => user.tipo !== "admin").slice(-4).reverse();

  const rows = [
    { label: "Aprovações pendentes", value: plural(pending, "conta"), variant: pending > 0 ? "warning" : "success" },
    { label: "Contas suspensas", value: plural(suspended, "conta"), variant: suspended > 0 ? "danger" : "neutral" },
    { label: "Sugestões de produtos", value: plural(suggestions.length, "nova", "novas"), variant: "neutral" },
    { label: "Balanças vinculadas sem sinal", value: plural(offline, "balança"), variant: offline > 0 ? "danger" : "success" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total de usuários" value={users.length} icon={<Users size={24} />} color="blue" />
        <StatCard label="Produtores ativos" value={approved("produtor")} icon={<Leaf size={24} />} color="green" />
        <StatCard label="Mercados ativos" value={approved("mercado")} icon={<Store size={24} />} color="orange" />
        <StatCard label="Produtos no catálogo" value={active} icon={<Package size={24} />} color="purple" />
        <StatCard label="Balanças com sinal" value={`${scales.filter((scale) => scale.online).length}/${scales.length}`} icon={<Radio size={24} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card flat className="p-6">
          <h3 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
            <Activity size={18} className="text-red-500" aria-hidden="true" /> Resumo de operações
          </h3>
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-semibold text-gray-600">{row.label}</span>
                <Badge variant={row.variant}>{row.value}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card flat className="p-6">
          <h3 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
            <TrendingUp size={18} className="text-blue-500" aria-hidden="true" /> Últimos cadastrados
          </h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nenhum cadastro ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((user) => (
                <li key={user.email} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{userName(user)}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Badge variant={KIND_VARIANT[user.tipo]}>{user.tipo}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
