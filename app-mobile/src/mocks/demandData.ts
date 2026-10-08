import type { Demand, Offer } from "@/types/produtor";

const OTHER_PRODUCERS = ["joao@fazendaboavista.com", "ana@sitiodasflores.com", "pedro@chacaraverde.com"];
const [JOAO, ANA, PEDRO] = OTHER_PRODUCERS;

const DAY_MS = 24 * 60 * 60 * 1000;

function offer(emailProdutor: string, quantidade: number): Offer {
  return { emailProdutor, quantidade };
}

function demand(
  id: string,
  produto: string,
  quantidade: number,
  unidade: string,
  precoMedio: number,
  daysAgo: number,
  ofertas: Offer[] = [],
  status: Demand["status"] = "ABERTA",
): Demand {
  const criadoEm = new Date(Date.now() - daysAgo * DAY_MS).toISOString();
  return { id, produto, quantidade, unidade, precoMedio, status, ofertas, criadoEm };
}

// Pedidos de exemplo. O e-mail de quem está vendo entra em duas demandas, para a aba Ofertas ter conteúdo.
export function seedDemands(viewerEmail: string): Demand[] {
  return [
    demand("d-tomate-1", "Tomate", 200, "Caixas", 45, 1, [offer(JOAO, 60)]),
    demand("d-alface-1", "Alface", 150, "Maços", 3.2, 1),
    demand("d-cenoura-1", "Cenoura", 300, "Kg", 4.5, 2, [offer(ANA, 120), offer(PEDRO, 50)]),
    demand("d-banana-1", "Banana", 80, "Caixas", 38, 2),
    demand("d-mandioca-1", "Mandioca", 500, "Kg", 3, 3, [offer(JOAO, 200)]),
    demand("d-maca-1", "Maçã", 120, "Caixas", 70, 1),
    demand("d-cebola-1", "Cebola", 400, "Kg", 3.8, 3, [offer(ANA, 100)]),
    demand("d-abobora-1", "Abóbora", 90, "Kg", 2.9, 4),
    demand("d-tomate-2", "Tomate", 100, "Caixas", 47, 5, [offer(viewerEmail, 40)]),
    demand("d-alface-2", "Alface", 60, "Maços", 3, 6, [offer(viewerEmail, 30), offer(JOAO, 30)], "CONCLUIDA"),
  ];
}
