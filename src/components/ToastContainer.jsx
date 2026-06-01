import React from 'react';
import { useStore } from '@nanostores/react';
import { toastsStore, removeToast } from '../store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const typeStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const TypeIcon = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

export default function ToastContainer() {
  const toasts = useStore(toastsStore);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = TypeIcon[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm max-w-[90vw] ${typeStyles[toast.type] || typeStyles.info}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded-full hover:bg-black/5 active:scale-90 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}