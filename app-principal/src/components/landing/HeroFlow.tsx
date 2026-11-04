"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Scale, Sprout, Store } from "lucide-react";

const PEDIDO_KG = 120;
const OFERTA_KG = 80;
const PESO_FINAL = 80.2;
// A faixa aceita é a da pesagem do app: 2% para cima ou para baixo.
const FAIXA = { min: OFERTA_KG * 0.98, max: OFERTA_KG * 1.02 };

const kg = (value: number, digits = 2) => value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// O caminho de um pedido, do jeito que ele acontece no sistema: o mercado pede, o produtor atende uma parte e a
// balança confere o peso. Uma única sequência ao abrir a página; quem pediu menos movimento vê o estado final.
export function HeroFlow() {
  const reduced = useReducedMotion();
  const [peso, setPeso] = useState(reduced ? PESO_FINAL : 0);
  const done = peso >= PESO_FINAL;

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, PESO_FINAL, { duration: 1.4, delay: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setPeso });
    return () => controls.stop();
  }, [reduced]);

  const enter = (delay: number) => (reduced ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Exemplo: o mercado pede 120 kg de tomate, um produtor atende 80 kg e a balança confere 80,20 kg">
      {/* O fio que liga os três passos. */}
      <div aria-hidden="true" className="absolute left-9 top-16 bottom-16 border-l-2 border-dashed border-green-300" />

      <motion.div {...enter(0.1)} className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-blue-50 text-blue-700"><Store size={20} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">Empório São José precisa de</p>
          <p className="font-display text-2xl font-bold text-gray-900">{PEDIDO_KG} kg de tomate</p>
          <p className="text-sm text-gray-500 mt-1">Entrega na sexta-feira</p>
        </div>
      </motion.div>

      <motion.div {...enter(0.45)} className="relative mt-4 ml-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-green-50 text-green-700"><Sprout size={20} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">Sítio Boa Vista atende</p>
          <p className="font-display text-2xl font-bold text-gray-900">{OFERTA_KG} kg</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full rounded-full bg-green-600"
              initial={reduced ? false : { width: 0 }}
              animate={{ width: `${(OFERTA_KG / PEDIDO_KG) * 100}%` }}
              transition={{ delay: 0.75, duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Os outros 40 kg ficam com mais produtores da região.</p>
        </div>
      </motion.div>

      <motion.div {...enter(0.8)} className="relative mt-4 ml-16 rounded-2xl bg-mata text-white p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-green-100"><Scale size={17} aria-hidden="true" /> Balança do galpão</p>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-100">
            <span className="w-2 h-2 rounded-full bg-milho" aria-hidden="true" /> ao vivo
          </span>
        </div>
        <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight mt-2 text-milho" aria-hidden="true">{kg(peso)} kg</p>
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-300 ${done ? "opacity-100" : "opacity-0"}`}>
          <CheckCircle2 size={17} className="text-green-300" aria-hidden="true" /> Dentro da faixa de {kg(FAIXA.min)} a {kg(FAIXA.max)} kg
        </p>
      </motion.div>
    </div>
  );
}
