import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown } from 'lucide-react';

export default function LimiteAlcanzadoModal({ tipo, visible, onClose }) {
  const mensajes = {
    productos: 'productos en tu nevera',
    insumos: 'insumos en tu alacena',
    recetas: 'recetas guardadas',
    fiados: 'fiados activos',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center relative"
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-black text-slate-800 mb-2">¡Has llegado al límite!</h2>
            <p className="text-slate-600 mb-4">
              El plan gratuito permite hasta {mensajes[tipo] || 'elementos'}.
              Para seguir creciendo sin límites, te invito a conocer Maxi Pro.
            </p>
            <button
              onClick={() => {
                // Aquí se integrará la pasarela de pago
                alert('Próximamente: integración con pasarela de pago. ¡Gracias por tu interés!');
                onClose();
              }}
              className="w-full bg-amber-500 text-white font-black py-3 rounded-2xl active:scale-95 transition-transform"
            >
              Conocer Maxi Pro
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 text-slate-400 text-sm font-bold"
            >
              Continuar con plan gratuito
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}