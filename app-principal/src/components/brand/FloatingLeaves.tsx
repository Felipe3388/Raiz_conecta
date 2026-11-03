"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "./BrandMark";

// As mesmas folhinhas do app: posição (% da largura), tamanho, duração e atraso de cada uma.
const LEAVES = [
  { left: 8, size: 20, duration: 9, delay: 0 },
  { left: 22, size: 28, duration: 11, delay: 1.8 },
  { left: 38, size: 16, duration: 8, delay: 0.9 },
  { left: 54, size: 24, duration: 10, delay: 3.2 },
  { left: 68, size: 18, duration: 9.5, delay: 2.2 },
  { left: 82, size: 26, duration: 12, delay: 0.6 },
  { left: 92, size: 16, duration: 8.5, delay: 4 },
] as const;

// Folhinhas caindo devagar ao fundo: só decoração, não recebe clique e some com "reduzir movimento".
export function FloatingLeaves() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LEAVES.map((leaf) => (
        <motion.span
          key={leaf.left}
          className="absolute top-0 text-green-600"
          style={{ left: `${leaf.left}%` }}
          initial={{ y: "-10vh", x: 0, rotate: -30, opacity: 0 }}
          animate={{ y: "105vh", x: [0, 24, -12], rotate: 200, opacity: [0, 0.35, 0.35, 0] }}
          transition={{ duration: leaf.duration, delay: leaf.delay, repeat: Infinity, ease: "linear" }}
        >
          <BrandMark size={leaf.size} />
        </motion.span>
      ))}
    </div>
  );
}
