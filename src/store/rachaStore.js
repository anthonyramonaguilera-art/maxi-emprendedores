import { atom } from 'nanostores';
import { esHoy, esAyer, fechaHoy } from '../lib/rachaHelpers';

const STORAGE_KEY = 'maxi_rachas';

function cargarDesdeLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo rachas del localStorage', e);
  }
  return null;
}

function guardarEnLocalStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Estado inicial: si no hay nada en localStorage, comenzamos con valores vacíos
const estadoInicial = cargarDesdeLocalStorage() || {
  ventas: { ultimaFecha: null, racha: 0 },
  cocina: { ultimaFecha: null, racha: 0 },
  aprendizaje: { ultimaFecha: null, racha: 0 },
};

export const rachasStore = atom(estadoInicial);

/**
 * Incrementa la racha del tipo dado si corresponde (hoy, ayer, etc.)
 */
export function incrementarRacha(tipo) {
  const estado = rachasStore.get();
  const actual = estado[tipo];
  const hoy = fechaHoy();

  let nuevaRacha = actual.racha || 0;
  let nuevaFecha = actual.ultimaFecha;

  if (!nuevaFecha) {
    // primera vez
    nuevaRacha = 1;
    nuevaFecha = hoy;
  } else if (esHoy(nuevaFecha)) {
    // ya se actualizó hoy, no hacer nada
    return;
  } else if (esAyer(nuevaFecha)) {
    nuevaRacha += 1;
    nuevaFecha = hoy;
  } else {
    // más de un día, reiniciar
    nuevaRacha = 1;
    nuevaFecha = hoy;
  }

  const nuevoEstado = {
    ...estado,
    [tipo]: { ultimaFecha: nuevaFecha, racha: nuevaRacha },
  };

  rachasStore.set(nuevoEstado);
  guardarEnLocalStorage(nuevoEstado);
}

/**
 * Actualiza la racha de aprendizaje si no se ha hecho hoy (para la apertura de la app)
 */
export function actualizarRachaAprendizaje() {
  incrementarRacha('aprendizaje');
}

/**
 * Devuelve las rachas actuales (útil para componentes)
 */
export function getRachas() {
  return rachasStore.get();
}