"use client";

import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useCepLookup } from "@/hooks/useCepLookup";
import { maskCep, maskUf } from "@/lib/format/mask";

export interface AddressValue {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export const EMPTY_ADDRESS: AddressValue = { cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "" };

// Os campos de endereço do site (cadastro e perfil): o CEP preenche rua, bairro, cidade e UF sozinho.
// `onChange` recebe só o que mudou.
export function AddressFields({ value, onChange }: { value: AddressValue; onChange: (patch: Partial<AddressValue>) => void }) {
  const { lookingUp, lookup } = useCepLookup((address) => onChange(address));
  const text = (field: keyof AddressValue) => (event: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: event.target.value });

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-1/2">
        <Input
          label="CEP"
          name="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          value={value.cep}
          onChange={(event) => {
            const cep = maskCep(event.target.value);
            onChange({ cep });
            void lookup(cep);
          }}
          placeholder="00000-000"
          hint="Preenchemos rua, bairro e cidade para você."
        />
        {lookingUp && <Loader2 className="absolute right-3 top-9 text-green-500 animate-spin" size={18} aria-label="Buscando CEP" />}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-3/4"><Input label="Rua / Estrada" name="rua" autoComplete="address-line1" value={value.rua} onChange={text("rua")} placeholder="Ex.: Estrada Rural, km 12" /></div>
        <div className="w-full sm:w-1/4"><Input label="Número" name="numero" value={value.numero} onChange={text("numero")} placeholder="Nº ou S/N" /></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/3"><Input label="Bairro" name="bairro" value={value.bairro} onChange={text("bairro")} /></div>
        <div className="w-full sm:w-1/3"><Input label="Cidade" name="cidade" autoComplete="address-level2" value={value.cidade} onChange={text("cidade")} /></div>
        <div className="w-full sm:w-1/3"><Input label="Estado (UF)" name="estado" autoComplete="address-level1" value={value.estado} onChange={(event) => onChange({ estado: maskUf(event.target.value) })} placeholder="SP" maxLength={2} /></div>
      </div>
    </div>
  );
}
