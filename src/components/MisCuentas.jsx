import React from 'react';
import { motion } from 'framer-motion';

export default function MisCuentas() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 text-center px-6">
      <div className="text-6xl mb-4 animate-bounce">📊</div>
      <h2 className="text-xl font-black text-slate-800 mb-2">Mis Cuentas</h2>
      <p className="text-sm font-bold text-slate-400">Próximamente: Aquí vivirá tu ganancia neta y el cuaderno de fiados de Maxi.</p>
    </motion.div>
  );
}