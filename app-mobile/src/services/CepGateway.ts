import type { Address } from "@/types/registration";

export type CepAddress = Pick<Address, "rua" | "bairro" | "cidade" | "estado">;

export type CepLookup = { found: true; address: CepAddress } | { found: false };

export interface CepGateway {
  lookup(cep: string): Promise<CepLookup>;
}
