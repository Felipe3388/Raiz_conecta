"use client";

import { MotionConfig, motion } from "framer-motion";

// A troca de página só esmaece (rápido): o conteúdo não "pula" de baixo para cima a cada clique.
// reducedMotion="user": quem pediu menos movimento no sistema não vê deslocamentos.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}
