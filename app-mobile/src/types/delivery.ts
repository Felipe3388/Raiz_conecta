// De onde veio o peso: lido da balança ou digitado pela pessoa.
export type WeighingSource = "BALANCA" | "DIGITADO";

export interface Weighing {
  id: string;
  kg: number;
  source: WeighingSource;
  // Quando foi pesado (data e hora completas).
  at: string;
}

// A pesagem feita pelo mercado ao receber.
export interface Receipt {
  kg: number;
  source: WeighingSource;
  at: string;
}

// Um produto que o produtor precisa levar para atender uma proposta aceita: uma entrega por produto aceito (propostaId é o pedido de onde veio). As entregas do
// mesmo mercado no mesmo dia formam um pedido (lib/delivery/orders).
export interface Delivery {
  id: string;
  propostaId: string;
  mercado: string;
  produto: string;
  // Unidade do pedido (Kg, Caixas, Maços) e quanto foi pedido nela.
  unidade: string;
  quantidade: number;
  // Preço fixo por unidade da proposta aceita.
  preco: number;
  // Dia da entrega, no formato "2026-10-08".
  dueDate: string;
  // Pesagens do produtor, antes de entregar à logística. Elas se somam.
  weighings: Weighing[];
  // Quando o produtor entregou à logística (ou null).
  handedOverAt: string | null;
  // Entregou com o peso fora da faixa aceita, sabendo disso.
  handedOverOutOfRange: boolean;
  // Pesagem do mercado ao receber (ou null).
  receipt: Receipt | null;
}

// Etapas da entrega, na ordem em que acontecem. DIVERGENTE: o mercado pesou fora da faixa.
export type DeliveryStage = "A_SEPARAR" | "PRONTA" | "COM_LOGISTICA" | "RECEBIDA" | "DIVERGENTE";

export interface WeighingInput {
  kg: number;
  source: WeighingSource;
}

// Quem está pesando: o produtor, antes de entregar à logística, ou o mercado, ao receber.
export type WeigherRole = "PRODUTOR" | "MERCADO";
