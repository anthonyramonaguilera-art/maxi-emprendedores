import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OnboardingWizard({ onComplete }) {
  const [paso, setPaso] = useState(0);
  const [respuesta, setRespuesta] = useState(null);

  const seleccionar = (tipo) => {
    setRespuesta(tipo);
    setPaso(1);
  };

  const finalizar = () => {
    onComplete(respuesta);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm font-sans">
      <AnimatePresence mode="wait">
        {paso === 0 && (
          <motion.div
            key="pregunta"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">¡Bienvenido a Maxi!</h2>
            <p className="text-slate-600 mb-6">
              Cuéntame un poco sobre tu negocio para ayudarte mejor.
            </p>
            <p className="font-bold text-slate-700 mb-4">¿Cuál es tu actividad principal?</p>
            <div className="space-y-3">
              <button
                onClick={() => seleccionar('emprendedor')}
                className="w-full flex items-center justify-center gap-3 bg-amber-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform text-lg"
              >
                <ChefHat className="w-6 h-6" />
                Fabrico mis productos
              </button>
              <button
                onClick={() => seleccionar('revendedor')}
                className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform text-lg"
              >
                <ShoppingBag className="w-6 h-6" />
                Compro productos hechos
              </button>
            </div>
          </motion.div>
        )}

        {paso === 1 && (
          <motion.div
            key="confirmacion"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="text-6xl mb-4">
              {respuesta === 'emprendedor' ? '👨🏻‍🍳' : '🛍️'}
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              {respuesta === 'emprendedor' ? '¡Perfecto, Emprendedor!' : '¡Genial, Revendedor!'}
            </h2>
            <p className="text-slate-600 mb-6">
              {respuesta === 'emprendedor'
                ? 'Te ayudaré a gestionar tus recetas, costos de producción y ventas. La Cocina será tu centro de operaciones.'
                : 'Te ayudaré a controlar tu inventario y ventas de forma sencilla. Podrás añadir productos directamente a tu nevera.'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              *Siempre tendrás acceso a todas las funciones. Esto solo organiza tu pantalla principal.
            </p>
            <button
              onClick={finalizar}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform"
            >
              ¡Comenzar a usar Maxi! <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}