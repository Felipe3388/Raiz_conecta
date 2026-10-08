import type { ProducerProfile } from "@/types/produtor";

export function seedProfile(email: string): ProducerProfile {
  return {
    email,
    nomeFantasia: "Sítio Boa Esperança",
    telefone: "(12) 91234-5678",
    tipoDoc: "CPF",
    documento: "123.456.789-01",
    cep: "18110-000",
    rua: "Estrada Rural, Km 12",
    numero: "120",
    cidade: "Votorantim",
    estado: "SP",
  };
}
