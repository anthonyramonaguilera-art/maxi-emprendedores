import { useStore } from '@nanostores/react';
import { Trophy, CheckCircle } from 'lucide-react';

const desafios = [
  { id: 'venta_5', texto: 'Vender 5 productos hoy', meta: 5, icon: '🛒', xp: 30 },
  { id: 'leccion_1', texto: 'Completar una lección', meta: 1, icon: '📚', xp: 20 },
  { id: 'insumo_1', texto: 'Añadir un insumo nuevo', meta: 1, icon: '📦', xp: 10 },
];

export default function DesafiosDiarios() {
  // Progreso diario (se reinicia cada día)
  const progreso = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('maxi_desafios_hoy') || '{}') : {};
  const hoy = new Date().toDateString();
  const guardado = typeof window !== 'undefined' ? localStorage.getItem('maxi_desafios_fecha') : null;

  // Resetear si es otro día
  if (guardado !== hoy && typeof window !== 'undefined') {
    localStorage.setItem('maxi_desafios_hoy', '{}');
    localStorage.setItem('maxi_desafios_fecha', hoy);
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-4 shadow-md text-white">
      <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5" /> Desafíos de Hoy
      </h3>
      <div className="space-y-2">
        {desafios.map(d => {
          const completado = (progreso[d.id] || 0) >= d.meta;
          return (
            <div key={d.id} className={`flex items-center gap-3 bg-white/20 rounded-xl p-2 backdrop-blur-sm ${completado ? 'opacity-60' : ''}`}>
              <span className="text-xl">{d.icono}</span>
              <div className="flex-1 text-sm font-bold">{d.texto}</div>
              {completado ? (
                <CheckCircle className="w-5 h-5 text-emerald-300" />
              ) : (
                <span className="text-xs font-black bg-white text-amber-700 px-2 py-0.5 rounded-full">+{d.xp} XP</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}