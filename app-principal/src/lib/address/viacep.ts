import { digits } from "@/lib/validation/cadastro";

export interface CepAddress {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export type CepLookup = { found: true; address: CepAddress } | { found: false; error: string };

type Fetcher = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// Endereço pelo CEP (ViaCEP, serviço público). Nunca lança: devolve a mensagem para mostrar à pessoa.
export async function lookupCep(cep: string, signal?: AbortSignal, fetcher: Fetcher = (url, init) => fetch(url, init)): Promise<CepLookup> {
  const clean = digits(cep);
  if (clean.length !== 8) return { found: false, error: "CEP inválido. Use os 8 números." };
  try {
    const response = await fetcher(`https://viacep.com.br/ws/${clean}/json/`, { signal });
    if (!response.ok) return { found: false, error: "Não foi possível buscar o CEP agora. Preencha o endereço à mão." };
    const data = (await response.json()) as Record<string, unknown>;
    if (!data || data.erro) return { found: false, error: "CEP não encontrado. Confira os números ou preencha à mão." };
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    return { found: true, address: { rua: text(data.logradouro), bairro: text(data.bairro), cidade: text(data.localidade), estado: text(data.uf).toUpperCase() } };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { found: false, error: "" };
    return { found: false, error: "Sem conexão para buscar o CEP. Preencha o endereço à mão." };
  }
}
