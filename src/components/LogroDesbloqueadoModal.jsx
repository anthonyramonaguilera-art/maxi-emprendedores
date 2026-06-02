import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { logroReciente, limpiarLogroReciente } from '../store/logrosStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function LogroDesbloqueadoModal() {
  const logro = useStore(logroReciente);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (logro) {
      setVisible(true);
      // Auto-cerrar después de 5 segundos
      const timer = setTimeout(() => {
        setVisible(false);
        limpiarLogroReciente();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [logro]);

  const cerrar = () => {
    setVisible(false);
    limpiarLogroReciente();
  };

  if (!logro || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center backdrop-blur-sm"
        onClick={cerrar}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={cerrar} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-6xl mb-4 animate-bounce">{logro.icono}</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{logro.titulo}</h2>
          <p className="text-slate-600 mb-3">{logro.mensaje}</p>
          <p className="text-xs italic text-slate-400 border-t pt-3">{logro.versiculo}</p>

          {/* Confeti simple con emojis */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <span className="absolute top-2 left-4 text-xl animate-ping">✨</span>
            <span className="absolute top-4 right-6 text-xl animate-pulse">🎉</span>
            <span className="absolute bottom-8 left-6 text-lg">🎊</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}