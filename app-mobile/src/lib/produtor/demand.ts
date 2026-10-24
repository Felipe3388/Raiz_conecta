import { normalizeText } from "@/lib/text/normalize";
import { effectiveStatus } from "./proposals";
import { clampQuantity } from "./quantity";
import type { Proposal, ProposalQuantities } from "@/types/proposal";

// A demanda dos mercados por produto: quanto eles pedem no total (somando os pedidos de todos os mercados) e quanto
// o produtor já atende, entre o que aceitou e o que está escolhendo agora. É o que a tela de Ofertas mostra para o
// produtor ver, de uma vez, quanto da demanda de cada produto ele cobre.

export interface DemandLine {
  produto: string;
  unit: string;
  // Quantos mercados pedem este produto.
  markets: number;
  // O total pedido, o que já foi aceito e o que está sendo escolhido agora (ainda não enviado).
  requested: number;
  accepted: number;
  choosing: number;
  // Aceito + escolhendo.
  offered: number;
  // Quanto da demanda isso cobre, de 0 a 100.
  percent: number;
  // Os mesmos totais em reais (preço fixo × quantidade), para somar produtos de unidades diferentes.
  requestedValue: number;
  offeredValue: number;
}

// Parte atendida do que foi pedido, de 0 a 100 e arredondada. Passou do pedido, é 100.
export function fulfilmentPercent(offered: number, requested: number): number {
  if (!(requested > 0)) return 0;
  return Math.round(Math.min(Math.max(offered / requested, 0), 1) * 100);
}

// Uma linha por produto, dos que têm mais demanda para os que têm menos. Entram os pedidos que esperam resposta (dentro
// do prazo) e os já aceitos; recusados e expirados não são mais demanda deste produtor.
export function demandByProduct(
  proposals: Proposal[],
  choices: Record<string, ProposalQuantities>,
  now: Date,
): DemandLine[] {
  const byProduct = new Map<string, DemandLine & { marketKeys: Set<string> }>();

  for (const proposal of proposals) {
    const status = effectiveStatus(proposal, now);
    if (status !== "PENDENTE" && status !== "ACEITA") continue;

    for (const item of proposal.itens) {
      const key = normalizeText(item.produto);
      const line = byProduct.get(key) ?? {
        produto: item.produto,
        unit: item.unidade.toLowerCase(),
        markets: 0,
        requested: 0,
        accepted: 0,
        choosing: 0,
        offered: 0,
        percent: 0,
        requestedValue: 0,
        offeredValue: 0,
        marketKeys: new Set<string>(),
      };

      const accepted = status === "ACEITA" ? (item.aceita ?? 0) : 0;
      const choosing = status === "PENDENTE" ? clampQuantity(choices[proposal.id]?.[item.id] ?? 0, item.quantidade) : 0;
      line.marketKeys.add(normalizeText(proposal.mercado));
      line.requested += item.quantidade;
      line.accepted += accepted;
      line.choosing += choosing;
      line.requestedValue += item.quantidade * item.preco;
      line.offeredValue += (accepted + choosing) * item.preco;
      byProduct.set(key, line);
    }
  }

  return [...byProduct.values()]
    .map(({ marketKeys, ...line }) => ({
      ...line,
      markets: marketKeys.size,
      offered: line.accepted + line.choosing,
      percent: fulfilmentPercent(line.accepted + line.choosing, line.requested),
    }))
    .sort((a, b) => b.requested - a.requested || a.produto.localeCompare(b.produto, "pt-BR"));
}

// O total de todos os produtos, pelo valor em reais (tudo é vendido por kg).
export function demandPercent(lines: DemandLine[]): number {
  const requested = lines.reduce((sum, line) => sum + line.requestedValue, 0);
  const offered = lines.reduce((sum, line) => sum + line.offeredValue, 0);
  return fulfilmentPercent(offered, requested);
}
