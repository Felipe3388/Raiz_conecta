"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, MapPin, UploadCloud } from "lucide-react";
import { AddressFields } from "@/components/forms/AddressFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileDrop } from "@/components/ui/FileDrop";
import { FormBlock } from "@/components/ui/FormBlock";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCompleteSignup } from "@/hooks/useCompleteSignup";
import { PROOF_TYPES } from "@/lib/auth/signupForm";
import { maskDocumento } from "@/lib/format/mask";
import { DOCUMENT_TYPES } from "@/lib/media/rules";

const DOC_TYPES = [
  { value: "CPF", label: "Pessoa Física (CPF)" },
  { value: "CNPJ", label: "Empresa (CNPJ)" },
];

// Passo 2 do cadastro: documento, endereço e foto do comprovante. A lógica fica em useCompleteSignup.
export default function CompletarPerfilPage() {
  const signup = useCompleteSignup();
  const { draft, form } = signup;

  // Sem o passo 1 não há o que completar: a tela só espera o redirecionamento.
  if (!draft) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-green-700" role="status">
        <Loader2 className="animate-spin" size={36} aria-label="Carregando" />
      </div>
    );
  }

  const proofLabel = PROOF_TYPES.find((type) => type.value === form.tipoComprovante)?.label ?? "seu documento";

  return (
    <div className="min-h-screen bg-green-50/30 p-4 sm:p-6 flex flex-col items-center justify-center pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
        <button type="button" onClick={signup.back} className="flex items-center text-gray-500 hover:text-green-700 font-bold transition-colors mb-6 h-11">
          <ArrowLeft className="mr-2" size={18} aria-hidden="true" /> Voltar para o passo 1
        </button>

        <div className="text-center mb-8">
          <h1 className="!text-3xl text-green-900 mb-2">Quase lá, {draft.nome.split(" ")[0]}!</h1>
          <p className="text-gray-600 font-medium">Precisamos só dos seus dados de entrega e de um documento para validar a conta.</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border-2 bg-green-50 border-green-300 text-green-800">
            {draft.tipoUsuario === "produtor" ? "🌱 Cadastrando como Produtor Rural" : "🏪 Cadastrando como Mercado"}
          </div>
          <p className="mt-4 text-xs font-bold text-gray-500">Passo 2 de 2</p>
        </div>

        <Card className="p-2 sm:p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void signup.submit();
            }}
            className="space-y-6"
            noValidate
          >
            <FormBlock title="Identificação oficial" icon={FileText} tone="green">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Select label="Tipo de documento" name="tipoDoc" value={form.tipoDoc} onChange={(e) => signup.setTipoDoc(e.target.value)} options={DOC_TYPES} />
                </div>
                <div className="w-full sm:w-2/3">
                  <Input
                    label="Número do documento"
                    name="documento"
                    inputMode="numeric"
                    value={form.documento}
                    onChange={(e) => signup.set("documento", maskDocumento(form.tipoDoc, e.target.value))}
                    placeholder={form.tipoDoc === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  />
                </div>
              </div>
            </FormBlock>

            <FormBlock title="Logística e endereço" icon={MapPin} tone="blue">
              <AddressFields value={form} onChange={signup.setAddress} />
            </FormBlock>

            <FormBlock title="Comprovante fotográfico" icon={UploadCloud} tone="amber">
              <Select label="O que você vai anexar?" name="tipoComprovante" value={form.tipoComprovante} onChange={(e) => signup.set("tipoComprovante", e.target.value)} options={[...PROOF_TYPES]} />
              <FileDrop file={signup.file} onChange={signup.setFile} accept={DOCUMENT_TYPES} what={proofLabel} />
            </FormBlock>

            <Button type="submit" className="w-full h-16 text-xl shadow-xl hover:shadow-green-200" isLoading={signup.sending}>
              Concluir cadastro
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
