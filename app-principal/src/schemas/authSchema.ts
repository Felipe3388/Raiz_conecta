import * as Yup from 'yup';


// Regras para a tela de Login

export const loginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Digite um e-mail válido')
        .required('O e-mail é obrigatório'),
    senha: Yup.string()
        .min(6, 'A senha deve ter no mínimo 6 caracteres')
        .required('A senha é obrigatória'),
});


// Regras para a tela de Cadastro (Passo 1 - Limpo)

export const cadastroSchema = Yup.object().shape({
    tipoUsuario: Yup.string().oneOf(['produtor', 'mercado']).required('Selecione o tipo de perfil'),
    nome: Yup.string()
        .min(3, 'O nome deve ter no mínimo 3 letras')
        .required('O nome/razão social é obrigatório'),
    email: Yup.string()
        .email('Digite um e-mail válido')
        .required('O e-mail é obrigatório'),
    senha: Yup.string()
        .min(6, 'A senha deve ter no mínimo 6 caracteres')
        .required('A senha é obrigatória'),
});


// Regras para Completar Perfil (Passo 2)

export const completarPerfilSchema = Yup.object().shape({
    tipoDoc: Yup.string().oneOf(['CPF', 'CNPJ']).required(),
    documento: Yup.string()
        .required('O documento é obrigatório')
        .test('valida-doc', 'Documento inválido', function (value) {
            if (!value) return false;
            const { tipoDoc } = this.parent;
            // Remove pontuação para contar os números
            const numeros = value.replace(/\D/g, '');
            if (tipoDoc === 'CPF') return numeros.length === 11;
            if (tipoDoc === 'CNPJ') return numeros.length === 14;
            return false;
        }),
    cep: Yup.string().required('O CEP é obrigatório'),
    rua: Yup.string().required('A rua é obrigatória'),
    numero: Yup.string().required('O número é obrigatório'),
    bairro: Yup.string().required('O bairro é obrigatório'),
    cidade: Yup.string().required('A cidade é obrigatória'),
    estado: Yup.string().required('O estado é obrigatório')
});