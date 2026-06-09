import { atom } from 'nanostores';
import { sumarPuntos } from './recompensasStore';

const inicial = typeof window !== 'undefined' ? {
  xp: parseInt(localStorage.getItem('maxi_xp') || '0'),
  nivel: parseInt(localStorage.getItem('maxi_nivel') || '1'),
  leccionesCompletadas: JSON.parse(localStorage.getItem('maxi_lecciones_completadas') || '[]'),
  rachaAprendizaje: parseInt(localStorage.getItem('maxi_racha_aprendizaje') || '0'),
  ultimaLeccion: localStorage.getItem('maxi_ultima_leccion') || null,
} : { xp: 0, nivel: 1, leccionesCompletadas: [], rachaAprendizaje: 0, ultimaLeccion: null };

export const xpStore = atom(inicial.xp);
export const nivelStore = atom(inicial.nivel);
export const leccionesCompletadasStore = atom(inicial.leccionesCompletadas);
export const rachaAprendizajeStore = atom(inicial.rachaAprendizaje);
export const ultimaLeccionStore = atom(inicial.ultimaLeccion);

function guardar() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('maxi_xp', xpStore.get().toString());
  localStorage.setItem('maxi_nivel', nivelStore.get().toString());
  localStorage.setItem('maxi_lecciones_completadas', JSON.stringify(leccionesCompletadasStore.get()));
  localStorage.setItem('maxi_racha_aprendizaje', rachaAprendizajeStore.get().toString());
  localStorage.setItem('maxi_ultima_leccion', ultimaLeccionStore.get() || '');
}

const XP_NIVEL = [0, 100, 250, 500, 900, 1400, 2000, 3000, 4500, 7000, 10000];

export function sumarXP(cantidad) {
  const nuevoXP = xpStore.get() + cantidad;
  xpStore.set(nuevoXP);
  let nuevoNivel = nivelStore.get();
  for (let i = XP_NIVEL.length - 1; i >= 0; i--) {
    if (nuevoXP >= XP_NIVEL[i]) {
      nuevoNivel = i + 1;
      break;
    }
  }
  if (nuevoNivel !== nivelStore.get()) {
    nivelStore.set(nuevoNivel);
    import('./logrosStore').then(({ desbloquearLogro }) => {
      if (nuevoNivel === 2) desbloquearLogro('nivel_2');
      else if (nuevoNivel === 3) desbloquearLogro('nivel_3');
      else if (nuevoNivel === 5) desbloquearLogro('nivel_5');
    });
  }
  guardar();
}

export function completarLeccion(leccionKey) {
  const completadas = leccionesCompletadasStore.get();
  if (!completadas.includes(leccionKey)) {
    leccionesCompletadasStore.set([...completadas, leccionKey]);
    sumarXP(50);
    sumarPuntos(50); // MaxiCoins
    // Actualizar racha de aprendizaje
    const hoy = new Date().toDateString();
    const ultima = ultimaLeccionStore.get();
    if (ultima !== hoy) {
      const ayer = new Date(Date.now() - 86400000).toDateString();
      if (ultima === ayer) {
        rachaAprendizajeStore.set(rachaAprendizajeStore.get() + 1);
      } else {
        rachaAprendizajeStore.set(1);
      }
      ultimaLeccionStore.set(hoy);
    }
    guardar();
    return true;
  }
  return false;
}