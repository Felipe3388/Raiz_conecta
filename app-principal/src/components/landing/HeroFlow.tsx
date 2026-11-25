"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sprout, Store, ArrowRight, PackageCheck } from "lucide-react";

const PEDIDO_KG = 120;
const OFFER_A_KG = 80;
const OFFER_B_KG = 40;

// Marketing illustration only (not a live customer order). The animation is about connecting supply and demand.
export function HeroFlow() {
  const reduced = useReducedMotion();
  const enter = (delay: number) => reduced ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label="Exemplo ilustrativo: um mercado pede 120 kg de tomate; dois produtores ofertam 80 kg e 40 kg, completando o pedido">
      <motion.div {...enter(0.1)} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 flex items-start gap-4">
        <span className="grid place-items-center w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-700"><Store size={23} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600">Empório São José solicita</p>
          <p className="font-display text-2xl font-extrabold text-gray-900">{PEDIDO_KG} kg de tomate</p>
          <p className="text-sm text-gray-500 mt-1">A necessidade chega aos produtores da região.</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 my-4 px-4" aria-hidden="true">
        <div className="h-px bg-green-200 flex-1" />
        <span className="grid place-items-center w-9 h-9 rounded-full bg-green-100 text-green-700"><ArrowRight size={19}/></span>
        <div className="h-px bg-green-200 flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div {...enter(0.35)} className="rounded-2xl bg-white border border-green-200 shadow-sm p-4 min-w-0">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-green-50 text-green-700"><Sprout size={23} aria-hidden="true" /></span>
          <p className="mt-3 text-xs sm:text-sm text-gray-600">Sítio Boa Vista oferece</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900">{OFFER_A_KG} kg</p>
          <div className="mt-3 h-2 bg-green-100 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div className="h-full bg-green-600 rounded-full" initial={reduced ? false : { width: 0 }} animate={{ width: "67%" }} transition={{ delay: 0.8, duration: 0.8 }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-green-800">Oferta parcial aceita</p>
        </motion.div>
        <motion.div {...enter(0.6)} className="rounded-2xl bg-white border border-green-200 shadow-sm p-4 min-w-0">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-green-50 text-green-700"><Sprout size={23} aria-hidden="true" /></span>
          <p className="mt-3 text-xs sm:text-sm text-gray-600">Horta da Região oferece</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900">{OFFER_B_KG} kg</p>
          <div className="mt-3 h-2 bg-green-100 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div className="h-full bg-green-500 rounded-full" initial={reduced ? false : { width: 0 }} animate={{ width: "33%" }} transition={{ delay: 1.1, duration: 0.8 }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-green-800">Oferta parcial aceita</p>
        </motion.div>
      </div>

      <motion.div {...enter(1)} className="mt-4 rounded-2xl bg-green-950 text-white p-5 shadow-lg flex gap-4 items-center">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-green-800"><PackageCheck size={26} aria-hidden="true" /></span>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-wide text-green-200 uppercase">Mercado + produtores conectados</p>
          <p className="font-display text-xl sm:text-2xl font-extrabold mt-1">Pedido de 120 kg atendido</p>
          <p className="text-sm text-green-100 mt-1">80 kg + 40 kg, direto de quem produz.</p>
        </div>
        <CheckCircle2 size={26} className="text-green-300 shrink-0" aria-hidden="true" />
      </motion.div>
    </div>
  );
}
