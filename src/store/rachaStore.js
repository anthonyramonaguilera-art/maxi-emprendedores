import { atom } from 'nanostores';
import { esHoy, esAyer, fechaHoy } from '../lib/rachaHelpers';
import { notificarRachaPerdida } from '../lib/maxiEventEmitter';

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

const estadoInicial = cargarDesdeLocalStorage() || {
  ventas: { ultimaFecha: null, racha: 0 },
  cocina: { ultimaFecha: null, racha: 0 },
  aprendizaje: { ultimaFecha: null, racha: 0 },
};

export const rachasStore = atom(estadoInicial);

export function incrementarRacha(tipo) {
  const estado = rachasStore.get();
  const actual = estado[tipo];
  const hoy = fechaHoy();

  let nuevaRacha = actual.racha || 0;
  let nuevaFecha = actual.ultimaFecha;

  if (!nuevaFecha) {
    nuevaRacha = 1;
    nuevaFecha = hoy;
  } else if (esHoy(nuevaFecha)) {
    return;
  } else if (esAyer(nuevaFecha)) {
    nuevaRacha += 1;
    nuevaFecha = hoy;
  } else {
    nuevaRacha = 1;
    nuevaFecha = hoy;
  }

  const nuevoEstado = {
    ...estado,
    [tipo]: { ultimaFecha: nuevaFecha, racha: nuevaRacha },
  };

  rachasStore.set(nuevoEstado);
  guardarEnLocalStorage(nuevoEstado);

  // Si la racha se reinició (pasó de >1 a 1), notificar a Maxi
  if (nuevaRacha === 1 && (actual.racha || 0) > 1) {
    notificarRachaPerdida(tipo);
  }
}

export function actualizarRachaAprendizaje() {
  incrementarRacha('aprendizaje');
}

export function getRachas() {
  return rachasStore.get();
}