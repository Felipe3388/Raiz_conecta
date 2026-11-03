"use client";

import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { BrandMark } from "./BrandMark";

// A logo com vida, como no app: o broto cresce ao abrir, balança devagar e gira quando tocado.
// Quem pediu menos movimento no sistema vê a logo parada.
export function BrandLogo({ size = 46 }: { size?: number }) {
  const reduced = useReducedMotion();
  const spin = useAnimationControls();

  return (
    <motion.button
      type="button"
      aria-label="Logo do Raiz Conecta"
      onClick={() => !reduced && void spin.start({ rotate: [0, 360], transition: { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] } })}
      initial={reduced ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      className="grid place-items-center rounded-3xl bg-green-100 p-4 text-green-600"
    >
      <motion.span animate={spin} className="block">
        <motion.span
          className="block"
          animate={reduced ? undefined : { rotate: [-7, 7, -7], y: [1.5, -1.5, 1.5] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrandMark size={size} />
        </motion.span>
      </motion.span>
    </motion.button>
  );
}
