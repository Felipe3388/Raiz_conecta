// Textos iguais aos do site (TermosModal e PrivacidadeModal). **Negrito** é interpretado por splitBold.
export interface LegalSection {
  title: string;
  intro?: string;
  body?: string;
  bullets?: string[];
  outro?: string;
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
}

export const TERMS_OF_USE: LegalDocument = {
  title: "Termos de Uso",
  subtitle: "Raiz Conecta — Plataforma de Agronegócio",
  updatedAt: "Última atualização: Janeiro de 2025",
  sections: [
    {
      title: "1. Aceitação dos Termos",
      body: "Ao acessar ou utilizar a plataforma **Raiz Conecta**, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar a plataforma.",
    },
    {
      title: "2. Sobre a Plataforma",
      body: "A Raiz Conecta é uma plataforma digital que conecta **produtores rurais** a **mercados e supermercados**, facilitando a comercialização de produtos agrícolas de forma direta, transparente e eficiente. A plataforma opera como um intermediário tecnológico e não é responsável pela qualidade, entrega ou conformidade dos produtos negociados entre as partes.",
    },
    {
      title: "3. Cadastro e Conta",
      bullets: [
        "O cadastro na plataforma está disponível para pessoas físicas (produtores rurais) e jurídicas (mercados e supermercados) devidamente regularizadas.",
        "O usuário é responsável por manter suas credenciais de acesso em sigilo e por todas as atividades realizadas sob sua conta.",
        "Todo cadastro passa por análise e aprovação da equipe administrativa antes de ter acesso completo à plataforma.",
        "A Raiz Conecta se reserva o direito de suspender ou encerrar contas que violem estes termos.",
      ],
    },
    {
      title: "4. Responsabilidades do Usuário",
      bullets: [
        "Fornecer informações verdadeiras, completas e atualizadas no momento do cadastro.",
        "Não utilizar a plataforma para fins ilícitos ou que violem a legislação brasileira.",
        "Não tentar acessar áreas restritas da plataforma sem autorização.",
        "Manter o ambiente de negociação respeitoso e profissional.",
        "Cumprir os acordos comerciais firmados por meio da plataforma.",
      ],
    },
    {
      title: "5. Produtos e Negociações",
      body: "Os produtores são responsáveis pelas informações, preços e disponibilidade dos produtos anunciados. A Raiz Conecta não garante a qualidade dos produtos e não se responsabiliza por disputas comerciais entre produtores e mercados. Recomendamos que todas as negociações sejam formalizadas por meio dos canais da plataforma.",
    },
    {
      title: "6. Propriedade Intelectual",
      body: "Todo o conteúdo da plataforma Raiz Conecta — incluindo logotipos, textos, imagens, código-fonte e design — é de propriedade exclusiva da Raiz Conecta ou de seus licenciantes. É vedada qualquer reprodução, distribuição ou uso comercial sem autorização expressa.",
    },
    {
      title: "7. Limitação de Responsabilidade",
      body: 'A Raiz Conecta não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma, incluindo perda de dados, lucros cessantes ou interrupção do serviço. A plataforma é fornecida "como está", sem garantias expressas ou implícitas.',
    },
    {
      title: "8. Modificações",
      body: "A Raiz Conecta pode modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.",
    },
    {
      title: "9. Legislação Aplicável",
      body: "Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca competente, conforme a legislação vigente.",
    },
    {
      title: "10. Contato",
      body: "Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail **suporte@raizconecta.com.br**.",
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Política de Privacidade",
  subtitle: "Raiz Conecta — Como tratamos seus dados",
  updatedAt: "Última atualização: Janeiro de 2025",
  intro:
    "A **Raiz Conecta** está comprometida em proteger e respeitar sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais em conformidade com a **Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)**.",
  sections: [
    {
      title: "1. Dados que Coletamos",
      intro: "Coletamos as seguintes categorias de dados:",
      bullets: [
        "**Dados de identificação:** nome, CPF/CNPJ, Inscrição Estadual, documento de identidade.",
        "**Dados de contato:** e-mail, telefone, endereço completo.",
        "**Dados de acesso:** logs de login, endereço IP, tipo de dispositivo.",
        "**Dados comerciais:** histórico de pedidos, ofertas, demandas e negociações.",
        "**Documentos:** imagens de documentos enviados para verificação de cadastro.",
      ],
    },
    {
      title: "2. Finalidade do Tratamento",
      intro: "Utilizamos seus dados para:",
      bullets: [
        "Criar, verificar e gerenciar sua conta na plataforma.",
        "Facilitar negociações entre produtores rurais e mercados.",
        "Enviar notificações relevantes sobre sua conta e atividades.",
        "Cumprir obrigações legais e regulatórias.",
        "Melhorar a experiência da plataforma e seus serviços.",
      ],
    },
    {
      title: "3. Compartilhamento de Dados",
      intro: "Seus dados **não são vendidos** a terceiros. Podemos compartilhá-los apenas nas seguintes situações:",
      bullets: [
        "Com outros usuários da plataforma quando necessário para a negociação (ex: nome e contato para finalização de pedidos).",
        "Com prestadores de serviços essenciais (hospedagem, envio de e-mails, armazenamento de imagens) sob obrigação de confidencialidade.",
        "Com autoridades públicas quando exigido por lei.",
      ],
    },
    {
      title: "4. Armazenamento e Segurança",
      body: "Seus dados são armazenados em servidores seguros, com criptografia em trânsito (HTTPS) e em repouso. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição. Imagens de documentos são armazenadas em serviço de nuvem com acesso restrito.",
    },
    {
      title: "5. Retenção de Dados",
      body: "Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei. Após o encerramento da conta, os dados podem ser mantidos por até 5 anos para fins de auditoria e cumprimento de obrigações legais.",
    },
    {
      title: "6. Seus Direitos (LGPD)",
      intro: "Como titular dos dados, você tem direito a:",
      bullets: [
        "**Confirmação e acesso:** saber quais dados temos sobre você.",
        "**Correção:** atualizar dados incompletos ou incorretos.",
        "**Anonimização ou exclusão:** solicitar a remoção de dados desnecessários.",
        "**Portabilidade:** receber seus dados em formato estruturado.",
        "**Revogação de consentimento:** retirar seu consentimento a qualquer momento.",
        "**Oposição:** se opor a tratamentos que violem seus direitos.",
      ],
      outro: "Para exercer seus direitos, entre em contato pelo e-mail de suporte.",
    },
    {
      title: "7. Cookies",
      body: "A plataforma utiliza cookies e tecnologias similares para manter sua sessão ativa, analisar o uso da plataforma e melhorar a experiência. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento de alguns recursos.",
    },
    {
      title: "8. Contato e DPO",
      body: "Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato com nossa equipe pelo e-mail **privacidade@raizconecta.com.br**. Responderemos em até 15 dias úteis.",
    },
  ],
};
