import { atom } from 'nanostores';

// 1. Intentamos buscar si la usuaria ya había guardado una tasa ayer en su teléfono
const tasaGuardada = typeof window !== 'undefined' ? localStorage.getItem('maxi_tasa_bcv') : null;

// 2. Creamos el "Átomo" (El cerebro global). Si no hay tasa guardada, arranca en 0.
export const tasaBcvStore = atom(tasaGuardada ? parseFloat(tasaGuardada) : 0);

// 3. Función mágica para actualizar la tasa en toda la app y en el disco duro a la vez
export function actualizarTasaBcv(nuevaTasa) {
  const tasaLimpia = parseFloat(nuevaTasa.toString().replace(',', '.'));
  if (!isNaN(tasaLimpia) && tasaLimpia > 0) {
    tasaBcvStore.set(tasaLimpia);
    if (typeof window !== 'undefined') {
      localStorage.setItem('maxi_tasa_bcv', tasaLimpia.toString());
    }
  }
}