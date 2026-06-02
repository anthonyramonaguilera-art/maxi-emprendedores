import { atom } from 'nanostores';

// ============================================
// ÁTOMOS DEL AVATAR (antes en useMaxiStore/zustand)
// ============================================
export const maxiVisible = atom(
  typeof window !== 'undefined' && localStorage.getItem('maxi_visible') === 'false' ? false : true
);

export const maxiUltimoEvento = atom(null);
export const maxiEventosPendientes = atom([]);

// Persistencia de visibilidad
maxiVisible.listen((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('maxi_visible', String(value));
  }
});

// ============================================
// ÁTOMOS DEL CHAT (ya existían)
// ============================================
export const chatAbierto = atom(false);
export const historial = atom([]);
export const eventosPendientesChat = atom([]);
export const noMolestar = atom(false);
export const escribiendo = atom(false);

// ============================================
// ACCIONES DEL AVATAR
// ============================================
export function toggleMaxiVisible() {
  maxiVisible.set(!maxiVisible.get());
}

export function emitirEvento(tipo, data = {}) {
  const evento = { tipo, data, timestamp: Date.now() };
  maxiUltimoEvento.set(evento);
  maxiEventosPendientes.set([...maxiEventosPendientes.get(), evento]);
}

export function limpiarEvento() {
  maxiUltimoEvento.set(null);
}

export function consumirSiguienteEvento() {
  const pendientes = maxiEventosPendientes.get();
  if (pendientes.length === 0) return null;
  const [siguiente, ...resto] = pendientes;
  maxiEventosPendientes.set(resto);
  return siguiente;
}

export function limpiarEventosPendientes() {
  maxiEventosPendientes.set([]);
}

// ============================================
// ACCIONES DEL CHAT
// ============================================
export function toggleChat() {
  chatAbierto.set(!chatAbierto.get());
}

export function cerrarChat() {
  chatAbierto.set(false);
}

export function agregarMensaje(tipo, texto) {
  historial.set([...historial.get(), { tipo, texto }]);
}

export function limpiarHistorial() {
  historial.set([]);
}

export function setNoMolestar(valor) {
  noMolestar.set(valor);
}

export function setEscribiendo(valor) {
  escribiendo.set(valor);
}

export function agregarEventoChat(evento) {
  eventosPendientesChat.set([...eventosPendientesChat.get(), evento]);
}

export function limpiarEventosChat() {
  eventosPendientesChat.set([]);
}