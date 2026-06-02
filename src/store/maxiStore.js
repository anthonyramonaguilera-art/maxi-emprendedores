import { atom } from 'nanostores';

const HISTORIAL_KEY = 'maxi_historial';
const NO_MOLESTAR_KEY = 'maxi_no_molestar';

function cargarHistorial() {
  try {
    const data = localStorage.getItem(HISTORIAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function guardarHistorial(historial) {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial.slice(-50))); // máximo 50 mensajes
}

function cargarNoMolestar() {
  return localStorage.getItem(NO_MOLESTAR_KEY) === 'true';
}

// Estado del chat
export const chatAbierto = atom(false);
export const historial = atom(cargarHistorial());
export const eventosPendientes = atom([]);
export const noMolestar = atom(cargarNoMolestar());
export const escribiendo = atom(false);

// Suscripción para persistir historial
historial.listen((value) => guardarHistorial(value));

// Acciones
export function toggleChat() {
  chatAbierto.set(!chatAbierto.get());
}

export function abrirChat() {
  chatAbierto.set(true);
}

export function cerrarChat() {
  chatAbierto.set(false);
}

export function agregarMensaje(tipo, texto) {
  const nuevo = {
    tipo, // 'user' o 'maxi'
    texto,
    timestamp: new Date().toISOString()
  };
  historial.set([...historial.get(), nuevo]);
}

export function limpiarHistorial() {
  historial.set([]);
}

export function setNoMolestar(valor) {
  noMolestar.set(valor);
  localStorage.setItem(NO_MOLESTAR_KEY, valor);
}

export function registrarEvento(tipo, datos = {}) {
  // Solo registrar si no está en modo no molestar
  if (noMolestar.get()) return;
  eventosPendientes.set([...eventosPendientes.get(), { tipo, datos, timestamp: Date.now() }]);
}

export function limpiarEventos() {
  eventosPendientes.set([]);
}

export function setEscribiendo(valor) {
  escribiendo.set(valor);
}