import type { RegistrationProfile } from "@/types/registration";

interface FieldCopy {
  label: string;
  hint: string;
  placeholder: string;
}

// Textos do campo de nome por perfil (Strategy por tabela): cada pessoa vê a sua realidade.
export const NAME_FIELD_COPY: Record<RegistrationProfile, FieldCopy> = {
  produtor: {
    label: "Nome da fazenda, sítio ou empresa",
    hint: "Digite o nome do seu negócio. É o que os outros vão ver.",
    placeholder: "Ex.: Sítio Boa Esperança",
  },
  mercado: {
    label: "Nome do mercado ou supermercado",
    hint: "Digite o nome da sua empresa. É o que os produtores vão ver.",
    placeholder: "Ex.: Mercado Boa Compra",
  },
};
