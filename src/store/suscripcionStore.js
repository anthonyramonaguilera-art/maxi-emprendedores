import { atom } from 'nanostores';

// Plan actual: 'free' o 'pro'
const planGuardado = typeof window !== 'undefined' ? localStorage.getItem('maxi_plan') : null;
export const planActual = atom(planGuardado || 'free');

planActual.listen((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('maxi_plan', value);
  }
});

export function actualizarPlan(nuevoPlan) {
  planActual.set(nuevoPlan);
}

// Límites según plan
export const LIMITES = {
  free: { productos: 20, insumos: 20, recetas: 5, fiados: 10 },
  pro: { productos: Infinity, insumos: Infinity, recetas: Infinity, fiados: Infinity },
};

export function obtenerLimite(tipo) {
  const plan = planActual.get();
  return LIMITES[plan]?.[tipo] ?? Infinity;
}