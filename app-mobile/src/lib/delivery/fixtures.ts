import type { Delivery, Weighing } from "@/types/delivery";

// Entregas de teste: 10 kg de cenoura por padrão (faixa aceita de 9,8 a 11 kg).
export function makeDelivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    id: "d-1",
    demandaId: "d-1",
    produto: "Cenoura",
    unidade: "Kg",
    quantidade: 10,
    preco: 4.5,
    dueDate: "2026-10-08",
    weighings: [],
    handedOverAt: null,
    handedOverOutOfRange: false,
    receipt: null,
    ...overrides,
  };
}

export function weighing(kg: number, id = `w-${kg}`): Weighing {
  return { id, kg, source: "BALANCA", at: "2026-10-08T10:00:00.000Z" };
}
