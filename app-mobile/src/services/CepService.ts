import { digitsOnly } from "@/lib/format/masks";
import type { CepGateway, CepLookup } from "./CepGateway";

const VIACEP_URL = "https://viacep.com.br/ws";
const LOOKUP_ERROR = "Não foi possível consultar o CEP.";

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

// Consulta o endereço no ViaCEP (serviço público, independente da nossa API).
export class CepService implements CepGateway {
  // O fetch é chamado por uma função própria: guardá-lo direto na classe quebra no navegador.
  constructor(
    private readonly fetchImpl: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async lookup(cep: string): Promise<CepLookup> {
    const digits = digitsOnly(cep);
    if (digits.length !== 8) return { found: false };

    const data = await this.fetchCep(digits);
    if (data.erro) return { found: false };

    return {
      found: true,
      address: {
        rua: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        estado: data.uf ?? "",
      },
    };
  }

  private async fetchCep(digits: string): Promise<ViaCepResponse> {
    try {
      const response = await this.fetchImpl(`${VIACEP_URL}/${digits}/json/`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      return (await response.json()) as ViaCepResponse;
    } catch {
      throw new Error(LOOKUP_ERROR);
    }
  }
}
