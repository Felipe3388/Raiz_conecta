"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            // 1. ESTADO INICIAL: A página começa invisível e 10 pixels para baixo
            initial={{ opacity: 0, y: 10 }}

            // 2. ESTADO FINAL: A página sobe para a posição original e fica visível
            animate={{ opacity: 1, y: 0 }}

            // 3. CONFIGURAÇÃO DA TRANSIÇÃO
            transition={{
                duration: 0.4, // Tempo da animação (0.4 segundos é o padrão de apps premium)
                ease: [0.22, 1, 0.36, 1], // Uma curva de velocidade personalizada (mais suave que o 'easeOut')
            }}
        >
            {children}
        </motion.div>
    );
}