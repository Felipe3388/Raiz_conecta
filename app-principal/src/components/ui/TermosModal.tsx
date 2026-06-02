"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ScrollText } from "lucide-react";

interface TermosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermosModal({ isOpen, onClose }: TermosModalProps) {
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
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <ScrollText size={20} className="text-green-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Termos de Uso</h2>
                  <p className="text-xs text-gray-500">Raiz Conecta — Plataforma de Agronegócio</p>
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

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                <p>
                  Ao acessar ou utilizar a plataforma <strong>Raiz Conecta</strong>, você concorda em cumprir e estar vinculado
                  a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar a plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">2. Sobre a Plataforma</h3>
                <p>
                  A Raiz Conecta é uma plataforma digital que conecta <strong>produtores rurais</strong> a
                  <strong> mercados e supermercados</strong>, facilitando a comercialização de produtos agrícolas de forma
                  direta, transparente e eficiente. A plataforma opera como um intermediário tecnológico e não é
                  responsável pela qualidade, entrega ou conformidade dos produtos negociados entre as partes.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">3. Cadastro e Conta</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>O cadastro na plataforma está disponível para pessoas físicas (produtores rurais) e jurídicas (mercados e supermercados) devidamente regularizadas.</li>
                  <li>O usuário é responsável por manter suas credenciais de acesso em sigilo e por todas as atividades realizadas sob sua conta.</li>
                  <li>Todo cadastro passa por análise e aprovação da equipe administrativa antes de ter acesso completo à plataforma.</li>
                  <li>A Raiz Conecta se reserva o direito de suspender ou encerrar contas que violem estes termos.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">4. Responsabilidades do Usuário</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Fornecer informações verdadeiras, completas e atualizadas no momento do cadastro.</li>
                  <li>Não utilizar a plataforma para fins ilícitos ou que violem a legislação brasileira.</li>
                  <li>Não tentar acessar áreas restritas da plataforma sem autorização.</li>
                  <li>Manter o ambiente de negociação respeitoso e profissional.</li>
                  <li>Cumprir os acordos comerciais firmados por meio da plataforma.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">5. Produtos e Negociações</h3>
                <p>
                  Os produtores são responsáveis pelas informações, preços e disponibilidade dos produtos anunciados.
                  A Raiz Conecta não garante a qualidade dos produtos e não se responsabiliza por disputas
                  comerciais entre produtores e mercados. Recomendamos que todas as negociações sejam formalizadas
                  por meio dos canais da plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">6. Propriedade Intelectual</h3>
                <p>
                  Todo o conteúdo da plataforma Raiz Conecta — incluindo logotipos, textos, imagens, código-fonte
                  e design — é de propriedade exclusiva da Raiz Conecta ou de seus licenciantes. É vedada
                  qualquer reprodução, distribuição ou uso comercial sem autorização expressa.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">7. Limitação de Responsabilidade</h3>
                <p>
                  A Raiz Conecta não se responsabiliza por danos indiretos, incidentais ou consequenciais
                  decorrentes do uso da plataforma, incluindo perda de dados, lucros cessantes ou interrupção
                  do serviço. A plataforma é fornecida "como está", sem garantias expressas ou implícitas.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">8. Modificações</h3>
                <p>
                  A Raiz Conecta pode modificar estes termos a qualquer momento. As alterações entrarão em vigor
                  imediatamente após a publicação. O uso continuado da plataforma após as alterações constitui
                  aceitação dos novos termos.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">9. Legislação Aplicável</h3>
                <p>
                  Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa
                  será resolvida no foro da comarca competente, conforme a legislação vigente.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-gray-900 mb-2">10. Contato</h3>
                <p>
                  Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail{" "}
                  <a href="mailto:suporte@raizconecta.com.br" className="text-green-600 font-bold hover:underline">
                    suporte@raizconecta.com.br
                  </a>.
                </p>
              </section>

            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={onClose}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Entendi e Concordo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
