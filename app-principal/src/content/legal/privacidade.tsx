// Texto do documento (só conteúdo). A janela que o mostra é a DocumentModal, em components/legal.
export function PrivacidadeContent() {
  return (
    <>
      <p className="text-gray-500 text-xs">Última atualização: Janeiro de 2025</p>

      <p>
        A <strong>Raiz Conecta</strong> está comprometida em proteger e respeitar sua privacidade.
        Esta política descreve como coletamos, usamos e protegemos suas informações pessoais em conformidade
        com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
      </p>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">1. Dados que Coletamos</h3>
        <p className="mb-2">Coletamos as seguintes categorias de dados:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Dados de identificação:</strong> nome, CPF/CNPJ, Inscrição Estadual, documento de identidade.</li>
          <li><strong>Dados de contato:</strong> e-mail, telefone, endereço completo.</li>
          <li><strong>Dados de acesso:</strong> logs de login, endereço IP, tipo de dispositivo.</li>
          <li><strong>Dados comerciais:</strong> histórico de pedidos, ofertas, demandas e negociações.</li>
          <li><strong>Documentos:</strong> imagens de documentos enviados para verificação de cadastro.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">2. Finalidade do Tratamento</h3>
        <p className="mb-2">Utilizamos seus dados para:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Criar, verificar e gerenciar sua conta na plataforma.</li>
          <li>Facilitar negociações entre produtores rurais e mercados.</li>
          <li>Enviar notificações relevantes sobre sua conta e atividades.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
          <li>Melhorar a experiência da plataforma e seus serviços.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">3. Compartilhamento de Dados</h3>
        <p>
          Seus dados <strong>não são vendidos</strong> a terceiros. Podemos compartilhá-los
          apenas nas seguintes situações:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Com outros usuários da plataforma quando necessário para a negociação (ex: nome e contato para finalização de pedidos).</li>
          <li>Com prestadores de serviços essenciais (hospedagem, envio de e-mails, armazenamento de imagens) sob obrigação de confidencialidade.</li>
          <li>Com autoridades públicas quando exigido por lei.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">4. Armazenamento e Segurança</h3>
        <p>
          Seus dados são armazenados em servidores seguros, com criptografia em trânsito (HTTPS) e em repouso.
          Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado,
          perda ou destruição. Imagens de documentos são armazenadas em serviço de nuvem com acesso restrito.
        </p>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">5. Retenção de Dados</h3>
        <p>
          Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política
          ou conforme exigido por lei. Após o encerramento da conta, os dados podem ser mantidos por até
          5 anos para fins de auditoria e cumprimento de obrigações legais.
        </p>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">6. Seus Direitos (LGPD)</h3>
        <p className="mb-2">Como titular dos dados, você tem direito a:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Confirmação e acesso:</strong> saber quais dados temos sobre você.</li>
          <li><strong>Correção:</strong> atualizar dados incompletos ou incorretos.</li>
          <li><strong>Anonimização ou exclusão:</strong> solicitar a remoção de dados desnecessários.</li>
          <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado.</li>
          <li><strong>Revogação de consentimento:</strong> retirar seu consentimento a qualquer momento.</li>
          <li><strong>Oposição:</strong> se opor a tratamentos que violem seus direitos.</li>
        </ul>
        <p className="mt-2">Para exercer seus direitos, entre em contato pelo e-mail de suporte.</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">7. Cookies</h3>
        <p>
          A plataforma utiliza cookies e tecnologias similares para manter sua sessão ativa,
          analisar o uso da plataforma e melhorar a experiência. Você pode configurar seu navegador
          para recusar cookies, mas isso pode afetar o funcionamento de alguns recursos.
        </p>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 mb-2">8. Contato e DPO</h3>
        <p>
          Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato com
          nossa equipe pelo e-mail{" "}
          <a href="mailto:privacidade@raizconecta.com.br" className="text-blue-600 font-bold hover:underline">
            privacidade@raizconecta.com.br
          </a>
          . Responderemos em até 15 dias úteis.
        </p>
      </section>
    </>
  );
}
