import { atom } from 'nanostores';

// Estado inicial desde localStorage
const inicial = typeof window !== 'undefined' ? {
  xp: parseInt(localStorage.getItem('maxi_xp') || '0'),
  nivel: parseInt(localStorage.getItem('maxi_nivel') || '1'),
  leccionesCompletadas: JSON.parse(localStorage.getItem('maxi_lecciones_completadas') || '[]'),
} : { xp: 0, nivel: 1, leccionesCompletadas: [] };

export const xpStore = atom(inicial.xp);
export const nivelStore = atom(inicial.nivel);
export const leccionesCompletadasStore = atom(inicial.leccionesCompletadas);

// Umbrales de XP para cada nivel (hasta nivel 10)
const XP_NIVEL = [0, 100, 250, 500, 900, 1400, 2000, 3000, 4500, 7000, 10000];

function guardar() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('maxi_xp', xpStore.get().toString());
  localStorage.setItem('maxi_nivel', nivelStore.get().toString());
  localStorage.setItem('maxi_lecciones_completadas', JSON.stringify(leccionesCompletadasStore.get()));
}

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
    // Disparar logro de nivel (si existe en logrosStore)
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
    sumarXP(50); // cada lección da 50 XP
    guardar();
    return true; // indica que se completó por primera vez
  }
  return false;
}