import { atom } from 'nanostores';

// Obtener datos guardados
const tasaGuardada = typeof window !== 'undefined' ? localStorage.getItem('maxi_tasa_bcv') : null;
const origenGuardado = typeof window !== 'undefined' ? localStorage.getItem('maxi_origen_tasa') : null;

export const tasaBcvStore = atom(tasaGuardada ? parseFloat(tasaGuardada) : 0);
export const origenTasaStore = atom(origenGuardado || 'oficial'); // 'oficial' o 'manual'

export function actualizarTasaBcv(nuevaTasa, origen = 'manual') {
  const tasaLimpia = parseFloat(nuevaTasa.toString().replace(',', '.'));
  if (!isNaN(tasaLimpia) && tasaLimpia > 0) {
    tasaBcvStore.set(tasaLimpia);
    origenTasaStore.set(origen);
    if (typeof window !== 'undefined') {
      localStorage.setItem('maxi_tasa_bcv', tasaLimpia.toString());
      localStorage.setItem('maxi_origen_tasa', origen);
    }
  }
}