import React from 'react';
import { useStore } from '@nanostores/react';
import { rachasStore } from '../store/rachaStore';
import { motion } from 'framer-motion';

const configRachas = [
  { tipo: 'ventas', icono: '🔥', label: 'Ventas', color: 'text-rose-500', bg: 'bg-rose-50', borde: 'border-rose-200' },
  { tipo: 'cocina', icono: '👨‍🍳', label: 'Cocina', color: 'text-amber-500', bg: 'bg-amber-50', borde: 'border-amber-200' },
  { tipo: 'aprendizaje', icono: '📚', label: 'Aprendizaje', color: 'text-indigo-500', bg: 'bg-indigo-50', borde: 'border-indigo-200' },
];

export default function RachaBar() {
  const rachas = useStore(rachasStore);

  return (
    <div className="flex gap-2 justify-center mt-1 mb-1">
      {configRachas.map(({ tipo, icono, label, color, bg, borde }) => {
        const racha = rachas[tipo]?.racha || 0;
        const pulso = racha >= 5;
        return (
          <motion.div
            key={tipo}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border ${bg} ${borde} shadow-sm`}
            title={`${label}: ${racha} día${racha !== 1 ? 's' : ''} seguido${racha !== 1 ? 's' : ''}`}
          >
            <span className="text-sm">{icono}</span>
            <motion.span
              className={`font-black text-sm ${color} ${pulso ? 'animate-pulse' : ''}`}
              key={racha}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {racha}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}