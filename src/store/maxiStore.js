import { atom } from 'nanostores';

// Estado del chat (aunque MaxiAvatar no usa chat, lo dejamos para compatibilidad)
export const chatAbierto = atom(false);
export const historial = atom([]);
export const escribiendo = atom(false);

// Estado de visibilidad de Maxi (avatar animado)
export const maxiVisible = atom(true); // persistirá en localStorage desde el componente

// Cola de eventos pendientes para mostrar en burbuja
export const eventosPendientes = atom([]);

// Funciones
export function toggleChat() {
  chatAbierto.set(!chatAbierto.get());
}

export function cerrarChat() {
  chatAbierto.set(false);
}

export function agregarMensaje(tipo, texto) {
  historial.set([...historial.get(), { tipo, texto, timestamp: Date.now() }]);
}

export function limpiarHistorial() {
  historial.set([]);
}

export function setEscribiendo(valor) {
  escribiendo.set(valor);
}

// Registrar evento para MaxiAvatar (se mostrará en la burbuja)
export function registrarEvento(tipo, datos = {}) {
  const evento = { tipo, datos, timestamp: Date.now() };
  eventosPendientes.set([...eventosPendientes.get(), evento]);
  // Auto-limpiar después de 5 segundos si no se muestra (por si acaso)
  setTimeout(() => {
    eventosPendientes.set(eventosPendientes.get().filter(e => e !== evento));
  }, 10000);
}

export function limpiarEventos() {
  eventosPendientes.set([]);
}