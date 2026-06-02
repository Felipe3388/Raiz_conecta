"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";

interface PrivacidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacidadeModal({ isOpen, onClose }: PrivacidadeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <ShieldCheck size={20} className="text-blue-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Política de Privacidade</h2>
                  <p className="text-xs text-gray-500">Raiz Conecta — Como tratamos seus dados</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6 text-sm text-gray-700 leading-relaxed">

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

            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={onClose}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
